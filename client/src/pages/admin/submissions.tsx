import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bug, Lightbulb, Clock, CheckCircle, XCircle, Eye, Loader2, MessageSquare, Filter } from "lucide-react";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { UserSubmission } from "@shared/schema";

type SubmissionWithUser = UserSubmission & { userName?: string; userEmail?: string };

function getStatusBadge(status: string) {
  switch (status) {
    case "SUBMITTED":
      return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Submitted</Badge>;
    case "UNDER_REVIEW":
      return <Badge variant="default"><Eye className="mr-1 h-3 w-3" />Under Review</Badge>;
    case "IN_PROGRESS":
      return <Badge className="bg-blue-600 text-white"><Loader2 className="mr-1 h-3 w-3" />In Progress</Badge>;
    case "COMPLETED":
      return <Badge className="bg-green-600 text-white"><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>;
    case "DECLINED":
      return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Declined</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getTypeBadge(type: string) {
  if (type === "ISSUE") {
    return <Badge variant="destructive"><Bug className="mr-1 h-3 w-3" />Issue</Badge>;
  }
  return <Badge className="bg-yellow-500 text-white"><Lightbulb className="mr-1 h-3 w-3" />Suggestion</Badge>;
}

function RespondDialog({ submission, onClose }: { submission: SubmissionWithUser; onClose: () => void }) {
  const [status, setStatus] = useState<string>(submission.status);
  const [adminResponse, setAdminResponse] = useState(submission.adminResponse || "");
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/admin/submissions/${submission.id}`, {
        status,
        adminResponse: adminResponse.trim() || null,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/submissions"] });
      toast({ title: "Submission updated", description: "Status and response have been saved." });
      onClose();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-3 bg-muted/50">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {getTypeBadge(submission.type)}
          <span className="text-sm font-medium">{submission.userName || submission.userEmail || "Unknown user"}</span>
          <span className="text-xs text-muted-foreground">
            {submission.createdAt ? new Date(submission.createdAt).toLocaleDateString() : ""}
          </span>
        </div>
        <p className="text-sm font-medium mb-1">{submission.title}</p>
        <p className="text-sm text-muted-foreground">{submission.description}</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Status</label>
        <Select value={status} onValueChange={setStatus} data-testid="select-submission-status">
          <SelectTrigger data-testid="select-submission-status-trigger">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="DECLINED">Declined</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Response to User</label>
        <Textarea
          placeholder="Write a response that will be visible to the user..."
          value={adminResponse}
          onChange={(e) => setAdminResponse(e.target.value)}
          rows={4}
          data-testid="input-admin-response"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} data-testid="button-cancel-respond">Cancel</Button>
        <Button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          data-testid="button-save-response"
        >
          {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

export default function AdminSubmissionsPage() {
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithUser | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data: submissions, isLoading } = useQuery<SubmissionWithUser[]>({
    queryKey: ["/api/admin/submissions"],
    refetchOnMount: "always",
  });

  const filtered = submissions?.filter(s => {
    if (typeFilter !== "ALL" && s.type !== typeFilter) return false;
    if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
    return true;
  }) || [];

  const issueCount = submissions?.filter(s => s.type === "ISSUE").length || 0;
  const suggestionCount = submissions?.filter(s => s.type === "SUGGESTION").length || 0;
  const pendingCount = submissions?.filter(s => s.status === "SUBMITTED" || s.status === "UNDER_REVIEW").length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">User Submissions</h1>
          <p className="text-muted-foreground">Review and respond to user-reported issues and suggestions</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Issues</p>
                  <p className="text-2xl font-bold" data-testid="text-issue-count">{issueCount}</p>
                </div>
                <Bug className="h-8 w-8 text-destructive opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Suggestions</p>
                  <p className="text-2xl font-bold" data-testid="text-suggestion-count">{suggestionCount}</p>
                </div>
                <Lightbulb className="h-8 w-8 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold" data-testid="text-pending-count">{pendingCount}</p>
                </div>
                <Clock className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-type-filter">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="ISSUE">Issues</SelectItem>
              <SelectItem value="SUGGESTION">Suggestions</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="DECLINED">Declined</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map(submission => (
              <Card key={submission.id} data-testid={`card-admin-submission-${submission.id}`}>
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {getTypeBadge(submission.type)}
                      <CardTitle className="text-base">{submission.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                      <span data-testid={`text-submitter-${submission.id}`}>
                        {submission.userName || submission.userEmail || "Unknown"}
                      </span>
                      <span>·</span>
                      <span>{submission.createdAt ? new Date(submission.createdAt).toLocaleDateString() : ""}</span>
                      <span>·</span>
                      {getStatusBadge(submission.status)}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSubmission(submission)}
                    data-testid={`button-respond-${submission.id}`}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Respond
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{submission.description}</p>
                  {submission.adminResponse && (
                    <div className="mt-3 rounded-md border p-3 bg-muted/50">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Admin Response</p>
                      <p className="text-sm">{submission.adminResponse}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground" data-testid="text-no-submissions">
                {submissions && submissions.length > 0
                  ? "No submissions match the current filters."
                  : "No user submissions yet."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Respond to Submission</DialogTitle>
            <DialogDescription>Update the status and provide a response to the user.</DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <RespondDialog
              submission={selectedSubmission}
              onClose={() => setSelectedSubmission(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
