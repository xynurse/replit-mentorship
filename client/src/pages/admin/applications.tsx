import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { DataTable, Column } from "@/components/ui/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { CheckCircle, XCircle, Clock, MoreHorizontal, Eye, FileText, Loader2 } from "lucide-react";
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
import type { CohortMembership } from "@shared/schema";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  WAITLISTED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

export default function AdminApplications() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");
  const [selectedApplication, setSelectedApplication] = useState<CohortMembership | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: applications = [], isLoading } = useQuery<CohortMembership[]>({
    queryKey: ["/api/applications", { status: statusFilter }],
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      return apiRequest("PATCH", `/api/applications/${id}`, { applicationStatus: status, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Application updated" });
      setSelectedApplication(null);
      setReviewNotes("");
    },
    onError: () => {
      toast({ title: "Failed to update application", variant: "destructive" });
    },
  });

  const columns: Column<CohortMembership>[] = [
    {
      key: "userId",
      header: "Applicant",
      sortable: true,
      render: (app) => (
        <div>
          <p className="font-medium">User ID: {app.userId.slice(0, 8)}...</p>
          <p className="text-sm text-muted-foreground">{app.role}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      render: (app) => (
        <Badge variant="outline">{app.role}</Badge>
      ),
    },
    {
      key: "applicationStatus",
      header: "Status",
      sortable: true,
      render: (app) => (
        <Badge className={`${statusColors[app.applicationStatus || 'PENDING']} no-default-hover-elevate no-default-active-elevate`}>
          {app.applicationStatus}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Submitted",
      sortable: true,
      render: (app) => app.createdAt ? format(new Date(app.createdAt), "MMM d, yyyy") : "-",
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      render: (app) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid={`button-actions-${app.id}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedApplication(app)}>
              <Eye className="mr-2 h-4 w-4" />
              Review
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {app.applicationStatus === "PENDING" && (
              <>
                <DropdownMenuItem
                  onClick={() => updateApplicationMutation.mutate({ id: app.id, status: "APPROVED" })}
                  className="text-green-600"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => updateApplicationMutation.mutate({ id: app.id, status: "REJECTED" })}
                  className="text-red-600"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => updateApplicationMutation.mutate({ id: app.id, status: "WAITLISTED" })}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Waitlist
                </DropdownMenuItem>
              </>
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
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Applications Review</h1>
          <p className="text-muted-foreground">Review and process membership applications</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle>Applications</CardTitle>
                <CardDescription>{applications.length} applications</CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36" data-testid="select-status-filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="WAITLISTED">Waitlisted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {applications.length === 0 && !isLoading ? (
              <div className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No {statusFilter.toLowerCase()} applications</h3>
                <p className="text-muted-foreground">
                  {statusFilter === "PENDING"
                    ? "All applications have been reviewed"
                    : "No applications match this filter"}
                </p>
              </div>
            ) : (
              <DataTable
                data={applications}
                columns={columns}
                searchPlaceholder="Search applications..."
                isLoading={isLoading}
                emptyMessage="No applications found"
              />
            )}
          </CardContent>
        </Card>

        <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Review Application</DialogTitle>
              <DialogDescription>Review the application details and make a decision</DialogDescription>
            </DialogHeader>
            {selectedApplication && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Role</p>
                    <Badge variant="outline">{selectedApplication.role}</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge className={`${statusColors[selectedApplication.applicationStatus || 'PENDING']} no-default-hover-elevate no-default-active-elevate`}>
                      {selectedApplication.applicationStatus}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Submitted</p>
                    <p className="font-medium">
                      {selectedApplication.createdAt
                        ? format(new Date(selectedApplication.createdAt), "MMM d, yyyy 'at' h:mm a")
                        : "-"}
                    </p>
                  </div>
                </div>

                {selectedApplication.applicationData && (
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Application Data</p>
                    <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">
                      {JSON.stringify(selectedApplication.applicationData, null, 2)}
                    </pre>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Review Notes</label>
                  <Textarea
                    placeholder="Add notes about this application..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="mt-1"
                    data-testid="textarea-notes"
                  />
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 flex-wrap">
              {selectedApplication?.applicationStatus === "PENDING" && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() =>
                      updateApplicationMutation.mutate({
                        id: selectedApplication.id,
                        status: "REJECTED",
                        notes: reviewNotes,
                      })
                    }
                    disabled={updateApplicationMutation.isPending}
                    data-testid="button-reject"
                  >
                    {updateApplicationMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    Reject
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      updateApplicationMutation.mutate({
                        id: selectedApplication.id,
                        status: "WAITLISTED",
                        notes: reviewNotes,
                      })
                    }
                    disabled={updateApplicationMutation.isPending}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Waitlist
                  </Button>
                  <Button
                    onClick={() =>
                      updateApplicationMutation.mutate({
                        id: selectedApplication.id,
                        status: "APPROVED",
                        notes: reviewNotes,
                      })
                    }
                    disabled={updateApplicationMutation.isPending}
                    data-testid="button-approve"
                  >
                    {updateApplicationMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Approve
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
