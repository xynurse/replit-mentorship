import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { DataTable, Column } from "@/components/ui/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  Eye,
  FileText,
  Loader2,
  Users,
  GraduationCap,
  UserCheck,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import type { ProgramApplication } from "@shared/schema";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  REVIEWING: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  WAITLISTED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

type RatingData = Record<string, number>;

const RATING_AREA_LABELS: Record<string, string> = {
  scienceResearch: "Science & Research",
  productDevelopment: "Product Development",
  innovation: "Innovation",
  businessStrategy: "Business Strategy",
  entrepreneurship: "Entrepreneurship",
  intrapreneurship: "Intrapreneurship",
  leadershipTeamManagement: "Leadership & Team Mgmt",
  networking: "Networking",
  professionalDevelopment: "Professional Development",
  digitalTech: "Digital & Tech",
  ethicalSocial: "Ethical & Social",
};

function RatingBadges({ ratings }: { ratings: RatingData }) {
  const nonZero = Object.entries(ratings).filter(([, v]) => v > 0);
  if (nonZero.length === 0) return <span className="text-muted-foreground text-xs">None rated</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {nonZero.map(([key, val]) => (
        <Badge key={key} variant="outline" className="text-xs">
          {RATING_AREA_LABELS[key] || key}: {val === 2 ? "★★" : "★"}
        </Badge>
      ))}
    </div>
  );
}

function AppDetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 py-1.5 text-sm border-b last:border-0">
      <span className="text-muted-foreground font-medium">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function ApplicationDetail({ app }: { app: ProgramApplication }) {
  const isMentee = app.role === "MENTEE";
  const d = (app.applicationData || {}) as Record<string, any>;
  const ratings: RatingData = isMentee ? (d.interestRatings || {}) : (d.comfortRatings || {});

  return (
    <div className="space-y-4 text-sm">
      {app.provisionedUserId && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-300 text-sm">
          <UserCheck className="h-4 w-4 shrink-0" />
          <span>
            Account provisioned{app.provisionedAt ? ` on ${format(new Date(app.provisionedAt), "MMM d, yyyy")}` : ""}. Set-password email sent.
          </span>
        </div>
      )}

      <div>
        <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Contact</p>
        <AppDetailRow label="Name" value={`${app.firstName} ${app.lastName}`} />
        <AppDetailRow label="Email" value={<a href={`mailto:${app.email}`} className="text-primary hover:underline">{app.email}</a>} />
        <AppDetailRow label="Language" value={app.preferredLanguage} />
        <AppDetailRow label="SONSIEL Member" value={app.isSonsielMember ? "Yes" : "No"} />
        {app.interestedInMembership !== null && (
          <AppDetailRow label="Interested in Membership" value={app.interestedInMembership ? "Yes" : "No"} />
        )}
      </div>

      <Separator />
      <div>
        <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Background</p>
        <AppDetailRow label="Title" value={app.currentTitle} />
        <AppDetailRow label="Institution" value={app.institution} />
        <AppDetailRow label="Fields" value={(app.fieldsOfExpertise as string[] || []).join(", ")} />
        <AppDetailRow label="Education" value={app.educationLevel} />
        <AppDetailRow label="Healthcare Exp." value={app.healthcareYearsExp} />
        <AppDetailRow label="Innovation Exp." value={app.innovationYearsExp} />
      </div>

      <Separator />
      <div>
        <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">
          {isMentee ? "Mentee Details" : "Mentor Details"}
        </p>

        {isMentee ? (
          <>
            <AppDetailRow label="Previously Mentored" value={d.previouslyMentored === true ? "Yes" : d.previouslyMentored === false ? "No" : null} />
            <AppDetailRow label="Hoping to Gain" value={(d.hopingToGain || []).join(", ")} />
            <AppDetailRow label="Preferred Methods" value={(d.preferredMethods || []).join(", ")} />
            <AppDetailRow label="Hours / Month" value={d.hoursPerMonth} />
            <AppDetailRow label="Duration" value={d.desiredDuration} />
            <AppDetailRow label="Best Days/Times" value={d.bestDaysTimes} />
            {d.primaryMotivations && <AppDetailRow label="Motivations" value={d.primaryMotivations} />}
            {d.specificSkillsWanted && <AppDetailRow label="Skills Wanted" value={d.specificSkillsWanted} />}
            {d.pastSuccesses && <AppDetailRow label="Past Successes" value={d.pastSuccesses} />}
            {d.pastChallenges && <AppDetailRow label="Past Challenges" value={d.pastChallenges} />}
            {d.resourcesNeeded && <AppDetailRow label="Resources Needed" value={d.resourcesNeeded} />}
            <AppDetailRow label="Willing to Pay" value={d.willingToPay} />
          </>
        ) : (
          <>
            <AppDetailRow label="Previously Mentored" value={d.previouslyMentored === true ? "Yes" : d.previouslyMentored === false ? "No" : null} />
            {d.mentorshipExperience && <AppDetailRow label="Experience" value={d.mentorshipExperience} />}
            {d.certifications && <AppDetailRow label="Certifications" value={d.certifications} />}
            <AppDetailRow label="Preferred Methods" value={(d.preferredMethods || []).join(", ")} />
            <AppDetailRow label="Hours / Month" value={d.hoursPerMonth} />
            <AppDetailRow label="Duration" value={d.mentoringDuration} />
            <AppDetailRow label="Best Days/Times" value={d.bestDaysTimes} />
            {d.primaryMotivations && <AppDetailRow label="Motivations" value={d.primaryMotivations} />}
            {d.specificSkillsToShare && <AppDetailRow label="Skills to Share" value={d.specificSkillsToShare} />}
            {d.pastSuccesses && <AppDetailRow label="Past Successes" value={d.pastSuccesses} />}
            {d.pastChallenges && <AppDetailRow label="Past Challenges" value={d.pastChallenges} />}
          </>
        )}

        {Object.keys(ratings).length > 0 && (
          <div className="pt-2">
            <p className="text-muted-foreground font-medium mb-1.5">
              {isMentee ? "Interest Ratings" : "Comfort Ratings"}
            </p>
            <RatingBadges ratings={ratings} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminApplications() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [selectedApplication, setSelectedApplication] = useState<ProgramApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [activateTarget, setActivateTarget] = useState<ProgramApplication | null>(null);

  const { data: applications = [], isLoading } = useQuery<ProgramApplication[]>({
    queryKey: ["/api/admin/program-applications", { status: statusFilter }],
    queryFn: async () => {
      const url = statusFilter === "ALL"
        ? `/api/admin/program-applications`
        : `/api/admin/program-applications?status=${statusFilter}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status?: string; adminNotes?: string }) => {
      return apiRequest("PATCH", `/api/admin/program-applications/${id}`, { status, adminNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/program-applications"] });
      toast({ title: "Application updated" });
      setSelectedApplication(null);
      setReviewNotes("");
    },
    onError: () => {
      toast({ title: "Failed to update", variant: "destructive" });
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/admin/program-applications/${id}/activate`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/program-applications"] });
      toast({
        title: "Account activated",
        description: "User account created and set-password email sent.",
      });
      setActivateTarget(null);
      setSelectedApplication(null);
    },
    onError: (err: any) => {
      toast({
        title: "Activation failed",
        description: err?.message || "Could not provision the account.",
        variant: "destructive",
      });
      setActivateTarget(null);
    },
  });

  const columns: Column<ProgramApplication>[] = [
    {
      key: "firstName",
      header: "Applicant",
      sortable: true,
      render: (app) => (
        <div>
          <p className="font-medium">{app.firstName} {app.lastName}</p>
          <p className="text-xs text-muted-foreground">{app.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (app) => (
        <div className="flex items-center gap-1.5">
          {app.role === "MENTEE"
            ? <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
            : <Users className="h-3.5 w-3.5 text-muted-foreground" />}
          <span className="text-sm">{app.role === "MENTEE" ? "Mentee" : "Mentor"}</span>
        </div>
      ),
    },
    {
      key: "institution",
      header: "Institution",
      sortable: true,
      render: (app) => <span className="text-sm">{app.institution || "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (app) => (
        <div className="flex items-center gap-1.5">
          <Badge className={`${statusColors[app.status || "PENDING"]} no-default-hover-elevate no-default-active-elevate`}>
            {app.status}
          </Badge>
          {app.provisionedUserId && (
            <UserCheck className="h-3.5 w-3.5 text-green-600" aria-label="Account provisioned" />
          )}
        </div>
      ),
    },
    {
      key: "submittedAt",
      header: "Submitted",
      sortable: true,
      render: (app) => app.submittedAt ? format(new Date(app.submittedAt), "MMM d, yyyy") : "—",
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      render: (app) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setSelectedApplication(app); setReviewNotes(app.adminNotes || ""); }}>
              <Eye className="mr-2 h-4 w-4" /> Review
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {app.status === "PENDING" && (
              <>
                <DropdownMenuItem onClick={() => updateMutation.mutate({ id: app.id, status: "REVIEWING" })}>
                  <Clock className="mr-2 h-4 w-4" /> Mark Reviewing
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => updateMutation.mutate({ id: app.id, status: "APPROVED" })}
                  className="text-green-600"
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Approve
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateMutation.mutate({ id: app.id, status: "WAITLISTED" })}>
                  <Clock className="mr-2 h-4 w-4" /> Waitlist
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => updateMutation.mutate({ id: app.id, status: "REJECTED" })}
                  className="text-red-600"
                >
                  <XCircle className="mr-2 h-4 w-4" /> Reject
                </DropdownMenuItem>
              </>
            )}
            {app.status === "REVIEWING" && (
              <>
                <DropdownMenuItem
                  onClick={() => updateMutation.mutate({ id: app.id, status: "APPROVED" })}
                  className="text-green-600"
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Approve
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateMutation.mutate({ id: app.id, status: "WAITLISTED" })}>
                  <Clock className="mr-2 h-4 w-4" /> Waitlist
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => updateMutation.mutate({ id: app.id, status: "REJECTED" })}
                  className="text-red-600"
                >
                  <XCircle className="mr-2 h-4 w-4" /> Reject
                </DropdownMenuItem>
              </>
            )}
            {app.status === "APPROVED" && !app.provisionedUserId && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setActivateTarget(app)}
                  className="text-primary font-medium"
                >
                  <Sparkles className="mr-2 h-4 w-4" /> Activate Account
                </DropdownMenuItem>
              </>
            )}
            {app.provisionedUserId && (
              <DropdownMenuItem disabled>
                <UserCheck className="mr-2 h-4 w-4 text-green-600" />
                <span className="text-green-600">Account Active</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Applications</h1>
          <p className="text-muted-foreground">Review and process mentorship program applications from <code className="text-xs">/apply</code></p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle>Program Applications</CardTitle>
                <CardDescription>
                  {statusFilter === "ALL"
                    ? `${applications.length} total application${applications.length !== 1 ? "s" : ""}`
                    : `${applications.length} ${statusFilter.toLowerCase()} application${applications.length !== 1 ? "s" : ""}`
                  }
                </CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REVIEWING">Reviewing</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="WAITLISTED">Waitlisted</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {applications.length === 0 && !isLoading ? (
              <div className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No {statusFilter === "ALL" ? "" : statusFilter.toLowerCase()} applications</h3>
                <p className="text-muted-foreground text-sm">
                  {statusFilter === "PENDING"
                    ? "New applications from /apply will appear here"
                    : "No applications match this filter"}
                </p>
              </div>
            ) : (
              <DataTable
                data={applications}
                columns={columns}
                searchPlaceholder="Search by name, email, or institution…"
                isLoading={isLoading}
                emptyMessage="No applications found"
              />
            )}
          </CardContent>
        </Card>

        {/* Detail / review dialog */}
        <Dialog open={!!selectedApplication} onOpenChange={(open) => { if (!open) setSelectedApplication(null); }}>
          <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedApplication && `${selectedApplication.firstName} ${selectedApplication.lastName}`}
              </DialogTitle>
              <DialogDescription asChild>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {selectedApplication && (
                    <>
                      <Badge className={`${statusColors[selectedApplication.status || "PENDING"]} no-default-hover-elevate no-default-active-elevate`}>
                        {selectedApplication.status}
                      </Badge>
                      {selectedApplication.provisionedUserId && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 no-default-hover-elevate no-default-active-elevate gap-1">
                          <UserCheck className="h-3 w-3" /> Account Active
                        </Badge>
                      )}
                      <span>·</span>
                      <span>{selectedApplication.role === "MENTEE" ? "Mentee Applicant" : "Mentor Applicant"}</span>
                      {selectedApplication.submittedAt && (
                        <><span>·</span><span>Submitted {format(new Date(selectedApplication.submittedAt), "MMM d, yyyy")}</span></>
                      )}
                    </>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>

            {selectedApplication && <ApplicationDetail app={selectedApplication} />}

            <div className="pt-2">
              <label className="text-sm font-medium">Admin Notes</label>
              <Textarea
                placeholder="Add internal notes about this application..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="mt-1.5"
                rows={3}
              />
            </div>

            <DialogFooter className="gap-2 flex-wrap sm:flex-nowrap">
              <Button
                variant="outline"
                onClick={() => updateMutation.mutate({ id: selectedApplication!.id, adminNotes: reviewNotes })}
                disabled={updateMutation.isPending}
              >
                Save Notes
              </Button>

              {(selectedApplication?.status === "PENDING" || selectedApplication?.status === "REVIEWING") && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => updateMutation.mutate({ id: selectedApplication!.id, status: "REJECTED", adminNotes: reviewNotes })}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    <span className="ml-1.5">Reject</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => updateMutation.mutate({ id: selectedApplication!.id, status: "WAITLISTED", adminNotes: reviewNotes })}
                    disabled={updateMutation.isPending}
                  >
                    <Clock className="h-4 w-4 mr-1.5" /> Waitlist
                  </Button>
                  <Button
                    onClick={() => updateMutation.mutate({ id: selectedApplication!.id, status: "APPROVED", adminNotes: reviewNotes })}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                    <span className="ml-1.5">Approve</span>
                  </Button>
                </>
              )}

              {selectedApplication?.status === "APPROVED" && !selectedApplication.provisionedUserId && (
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setActivateTarget(selectedApplication)}
                  disabled={activateMutation.isPending}
                >
                  {activateMutation.isPending
                    ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    : <Sparkles className="h-4 w-4 mr-1.5" />}
                  Activate Account
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Activate confirmation dialog */}
        <AlertDialog open={!!activateTarget} onOpenChange={(open) => { if (!open) setActivateTarget(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Activate account for {activateTarget?.firstName} {activateTarget?.lastName}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will create a <strong>{activateTarget?.role === "MENTEE" ? "Mentee" : "Mentor"}</strong> user account
                using the information from this application and send a <strong>set-password email</strong> to{" "}
                <strong>{activateTarget?.email}</strong>. Their profile will be pre-populated from the application data.
                <br /><br />
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={activateMutation.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => activateTarget && activateMutation.mutate(activateTarget.id)}
                disabled={activateMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {activateMutation.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Activating…</>
                  : <><Sparkles className="h-4 w-4 mr-1.5" /> Yes, Activate Account</>
                }
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
