import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Activity,
  Radio,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { PlatformIssue } from "@shared/schema";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof AlertCircle; badgeVariant: "default" | "secondary" | "destructive" | "outline" }> = {
  INVESTIGATING: { label: "Investigating", color: "text-red-500", icon: Search, badgeVariant: "destructive" },
  IN_PROGRESS: { label: "In Progress", color: "text-yellow-500", icon: Clock, badgeVariant: "secondary" },
  MONITORING: { label: "Monitoring", color: "text-blue-500", icon: Activity, badgeVariant: "outline" },
  RESOLVED: { label: "Resolved", color: "text-green-500", icon: CheckCircle, badgeVariant: "default" },
};

function formatDate(dateString: string | Date) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminPlatformStatus() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingIssue, setEditingIssue] = useState<PlatformIssue | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<string>("INVESTIGATING");

  const { data: issues = [], isLoading } = useQuery<PlatformIssue[]>({
    queryKey: ["/api/admin/platform-issues"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; status: string }) => {
      const res = await apiRequest("POST", "/api/admin/platform-issues", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/platform-issues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-status"] });
      toast({ title: "Issue created" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Failed to create issue", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PlatformIssue> }) => {
      const res = await apiRequest("PATCH", `/api/admin/platform-issues/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/platform-issues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-status"] });
      toast({ title: "Issue updated" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Failed to update issue", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/platform-issues/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/platform-issues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-status"] });
      toast({ title: "Issue deleted" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete issue", variant: "destructive" });
    },
  });

  function openCreateDialog() {
    setEditingIssue(null);
    setFormTitle("");
    setFormDescription("");
    setFormStatus("INVESTIGATING");
    setDialogOpen(true);
  }

  function openEditDialog(issue: PlatformIssue) {
    setEditingIssue(issue);
    setFormTitle(issue.title);
    setFormDescription(issue.description || "");
    setFormStatus(issue.status);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingIssue(null);
    setFormTitle("");
    setFormDescription("");
    setFormStatus("INVESTIGATING");
  }

  function handleSubmit() {
    if (!formTitle.trim()) return;
    if (editingIssue) {
      updateMutation.mutate({
        id: editingIssue.id,
        data: { title: formTitle.trim(), description: formDescription.trim() || null, status: formStatus as any },
      });
    } else {
      createMutation.mutate({
        title: formTitle.trim(),
        description: formDescription.trim(),
        status: formStatus,
      });
    }
  }

  const activeCount = issues.filter((i) => i.status !== "RESOLVED").length;
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Platform Status</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage platform status issues visible on the login page
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={activeCount > 0 ? "destructive" : "default"} data-testid="badge-active-count">
              {activeCount > 0 ? `${activeCount} Active` : "All Clear"}
            </Badge>
            <Button onClick={openCreateDialog} data-testid="button-create-issue">
              <Plus className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Loading issues...</p>
            </CardContent>
          </Card>
        ) : issues.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-3" />
              <p className="text-lg font-medium">All Systems Operational</p>
              <p className="text-sm text-muted-foreground mt-1">
                No platform issues have been reported. Click "Report Issue" to add one.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {issues.map((issue) => {
              const config = STATUS_CONFIG[issue.status] || STATUS_CONFIG.INVESTIGATING;
              const StatusIcon = config.icon;
              return (
                <Card key={issue.id} data-testid={`card-issue-${issue.id}`}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <StatusIcon className={`h-4 w-4 shrink-0 ${config.color}`} />
                          <span className="font-medium">{issue.title}</span>
                          <Badge variant={config.badgeVariant} className="text-xs" data-testid={`badge-issue-status-${issue.id}`}>
                            {config.label}
                          </Badge>
                        </div>
                        {issue.description && (
                          <p className="text-sm text-muted-foreground ml-6">{issue.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground ml-6">
                          <span>Reported: {formatDate(issue.dateReported)}</span>
                          <span>Updated: {formatDate(issue.lastUpdated)}</span>
                          {issue.resolvedAt && (
                            <span>Resolved: {formatDate(issue.resolvedAt)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(issue)}
                          data-testid={`button-edit-issue-${issue.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(issue.id)}
                          data-testid={`button-delete-issue-${issue.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingIssue ? "Edit Issue" : "Report New Issue"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Title</label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Brief description of the issue"
                  data-testid="input-issue-title"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Description</label>
                <Textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Details about the issue and its impact on users"
                  rows={3}
                  data-testid="input-issue-description"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Status</label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger data-testid="select-issue-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INVESTIGATING">Investigating</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="MONITORING">Monitoring</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog} data-testid="button-cancel-issue">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formTitle.trim() || isPending}
                data-testid="button-submit-issue"
              >
                {isPending ? "Saving..." : editingIssue ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Issue</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this issue? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && deleteMutation.mutate(deleteId)}
                data-testid="button-confirm-delete"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
