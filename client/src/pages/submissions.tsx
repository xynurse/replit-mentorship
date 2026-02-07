import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bug, Lightbulb, Send, Clock, CheckCircle, XCircle, Eye, Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { UserSubmission } from "@shared/schema";

function getStatusBadge(status: string) {
  switch (status) {
    case "SUBMITTED":
      return <Badge variant="secondary" data-testid={`badge-status-${status}`}><Clock className="mr-1 h-3 w-3" />Submitted</Badge>;
    case "UNDER_REVIEW":
      return <Badge variant="default" data-testid={`badge-status-${status}`}><Eye className="mr-1 h-3 w-3" />Under Review</Badge>;
    case "IN_PROGRESS":
      return <Badge className="bg-blue-600 text-white" data-testid={`badge-status-${status}`}><Loader2 className="mr-1 h-3 w-3" />In Progress</Badge>;
    case "COMPLETED":
      return <Badge className="bg-green-600 text-white" data-testid={`badge-status-${status}`}><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>;
    case "DECLINED":
      return <Badge variant="destructive" data-testid={`badge-status-${status}`}><XCircle className="mr-1 h-3 w-3" />Declined</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function SubmitDialog({ type, onClose }: { type: "ISSUE" | "SUGGESTION"; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/submissions", { type, title, description });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to submit");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      toast({
        title: type === "ISSUE" ? "Issue reported" : "Suggestion submitted",
        description: "Thank you for your feedback! An admin will review it shortly.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isValid = title.trim().length > 0 && description.trim().length > 0;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="submission-title">Title</label>
        <Input
          id="submission-title"
          placeholder={type === "ISSUE" ? "Brief description of the issue..." : "Title for your suggestion..."}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          data-testid="input-submission-title"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="submission-description">Description</label>
        <Textarea
          id="submission-description"
          placeholder={type === "ISSUE" ? "Please describe the issue in detail. What were you trying to do? What happened instead?" : "Describe your suggestion. How would this improve the platform?"}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          data-testid="input-submission-description"
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} data-testid="button-cancel-submission">
          Cancel
        </Button>
        <Button
          onClick={() => submitMutation.mutate()}
          disabled={!isValid || submitMutation.isPending}
          data-testid="button-submit-submission"
        >
          {submitMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Submit
        </Button>
      </div>
    </div>
  );
}

function SubmissionCard({ submission }: { submission: UserSubmission }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card data-testid={`card-submission-${submission.id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-2">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {submission.type === "ISSUE" ? (
              <Bug className="h-4 w-4 text-destructive shrink-0" />
            ) : (
              <Lightbulb className="h-4 w-4 text-yellow-500 shrink-0" />
            )}
            <CardTitle className="text-base">{submission.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {submission.type === "ISSUE" ? "Issue" : "Suggestion"}
            </Badge>
            {getStatusBadge(submission.status)}
            <span className="text-xs text-muted-foreground">
              {submission.createdAt ? new Date(submission.createdAt).toLocaleDateString() : ""}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {expanded || submission.description.length <= 150
            ? submission.description
            : `${submission.description.slice(0, 150)}...`}
        </p>
        {submission.description.length > 150 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            data-testid={`button-expand-${submission.id}`}
          >
            {expanded ? "Show less" : "Show more"}
          </Button>
        )}
        {submission.adminResponse && (
          <div className="rounded-md border p-3 bg-muted/50">
            <p className="text-xs font-medium text-muted-foreground mb-1">Admin Response</p>
            <p className="text-sm" data-testid={`text-admin-response-${submission.id}`}>{submission.adminResponse}</p>
            {submission.respondedAt && (
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(submission.respondedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SubmissionsPage() {
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [suggestionDialogOpen, setSuggestionDialogOpen] = useState(false);

  const { data: submissions, isLoading } = useQuery<UserSubmission[]>({
    queryKey: ["/api/submissions"],
    refetchOnMount: "always",
  });

  const issues = submissions?.filter(s => s.type === "ISSUE") || [];
  const suggestions = submissions?.filter(s => s.type === "SUGGESTION") || [];

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">Feedback & Support</h1>
            <p className="text-muted-foreground">Report issues or suggest improvements to the platform</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Dialog open={issueDialogOpen} onOpenChange={setIssueDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" data-testid="button-report-issue">
                  <Bug className="mr-2 h-4 w-4" />
                  Report Issue
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Report an Issue</DialogTitle>
                  <DialogDescription>
                    Let us know about any problems you're experiencing on the platform.
                  </DialogDescription>
                </DialogHeader>
                <SubmitDialog type="ISSUE" onClose={() => setIssueDialogOpen(false)} />
              </DialogContent>
            </Dialog>

            <Dialog open={suggestionDialogOpen} onOpenChange={setSuggestionDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-submit-suggestion">
                  <Lightbulb className="mr-2 h-4 w-4" />
                  Submit Suggestion
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit a Suggestion</DialogTitle>
                  <DialogDescription>
                    Share your ideas for improving or adding features to the platform.
                  </DialogDescription>
                </DialogHeader>
                <SubmitDialog type="SUGGESTION" onClose={() => setSuggestionDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList data-testid="tabs-submissions">
            <TabsTrigger value="all" data-testid="tab-all">
              All ({submissions?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="issues" data-testid="tab-issues">
              Issues ({issues.length})
            </TabsTrigger>
            <TabsTrigger value="suggestions" data-testid="tab-suggestions">
              Suggestions ({suggestions.length})
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="space-y-4 mt-4">
              {[1, 2, 3].map(i => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <TabsContent value="all" className="space-y-4">
                {submissions && submissions.length > 0 ? (
                  submissions.map(s => <SubmissionCard key={s.id} submission={s} />)
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground" data-testid="text-no-submissions">
                        You haven't submitted any issues or suggestions yet. Use the buttons above to share your feedback.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              <TabsContent value="issues" className="space-y-4">
                {issues.length > 0 ? (
                  issues.map(s => <SubmissionCard key={s.id} submission={s} />)
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground">No issues reported yet.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              <TabsContent value="suggestions" className="space-y-4">
                {suggestions.length > 0 ? (
                  suggestions.map(s => <SubmissionCard key={s.id} submission={s} />)
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground">No suggestions submitted yet.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
