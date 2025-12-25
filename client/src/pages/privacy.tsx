import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  FileDown,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface DataExportRequest {
  id: string;
  status: string;
  downloadUrl: string | null;
  expiresAt: string | null;
  createdAt: string;
  completedAt: string | null;
}

interface AccountDeletionRequest {
  id: string;
  status: string;
  reason: string | null;
  scheduledDeletionAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
}

export default function PrivacyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deletionReason, setDeletionReason] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: exportRequests, isLoading: exportLoading } = useQuery<DataExportRequest[]>({
    queryKey: ["/api/data-export"],
    queryFn: async () => {
      const res = await fetch("/api/data-export");
      if (!res.ok) throw new Error("Failed to fetch export requests");
      return res.json();
    },
  });

  const { data: deletionRequests, isLoading: deletionLoading } = useQuery<AccountDeletionRequest[]>({
    queryKey: ["/api/account-deletion"],
    queryFn: async () => {
      const res = await fetch("/api/account-deletion");
      if (!res.ok) throw new Error("Failed to fetch deletion requests");
      return res.json();
    },
  });

  const requestExportMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/data-export");
    },
    onSuccess: () => {
      toast({ title: "Data export request submitted", description: "You will be notified when your data is ready to download." });
      queryClient.invalidateQueries({ queryKey: ["/api/data-export"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to request data export", description: error.message, variant: "destructive" });
    },
  });

  const requestDeletionMutation = useMutation({
    mutationFn: async (reason: string) => {
      return apiRequest("POST", "/api/account-deletion", { reason });
    },
    onSuccess: () => {
      toast({ title: "Account deletion request submitted", description: "Your account is scheduled for deletion in 30 days. You can cancel this request anytime before then." });
      queryClient.invalidateQueries({ queryKey: ["/api/account-deletion"] });
      setShowDeleteDialog(false);
      setDeletionReason("");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to request account deletion", description: error.message, variant: "destructive" });
    },
  });

  const cancelDeletionMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/account-deletion/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Account deletion cancelled", description: "Your account will not be deleted." });
      queryClient.invalidateQueries({ queryKey: ["/api/account-deletion"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to cancel deletion", description: error.message, variant: "destructive" });
    },
  });

  const pendingExport = exportRequests?.find(r => r.status === 'PENDING' || r.status === 'PROCESSING');
  const completedExport = exportRequests?.find(r => r.status === 'COMPLETED' && r.downloadUrl);
  const pendingDeletion = deletionRequests?.find(r => r.status === 'PENDING' || r.status === 'SCHEDULED');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'PROCESSING':
        return <Badge variant="secondary"><RefreshCw className="h-3 w-3 mr-1" /> Processing</Badge>;
      case 'COMPLETED':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" /> Completed</Badge>;
      case 'SCHEDULED':
        return <Badge variant="destructive"><Clock className="h-3 w-3 mr-1" /> Scheduled</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" /> Cancelled</Badge>;
      case 'EXPIRED':
        return <Badge variant="outline"><AlertTriangle className="h-3 w-3 mr-1" /> Expired</Badge>;
      case 'FAILED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-8 space-y-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">Privacy & Data</h1>
            <p className="text-muted-foreground">
              Manage your personal data and privacy settings
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5" />
              Export Your Data
            </CardTitle>
            <CardDescription>
              Request a copy of all your personal data stored on SONSIEL Mentorship Hub. 
              This includes your profile information, messages, documents, tasks, goals, and activity history.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {exportLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : pendingExport ? (
              <div className="flex items-center justify-between p-4 bg-muted rounded-md">
                <div>
                  <p className="font-medium">Export in progress</p>
                  <p className="text-sm text-muted-foreground">
                    Requested on {format(new Date(pendingExport.createdAt), "PPp")}
                  </p>
                </div>
                {getStatusBadge(pendingExport.status)}
              </div>
            ) : completedExport ? (
              <div className="flex items-center justify-between p-4 bg-muted rounded-md">
                <div>
                  <p className="font-medium">Your data is ready</p>
                  <p className="text-sm text-muted-foreground">
                    Completed on {format(new Date(completedExport.completedAt!), "PPp")}
                    {completedExport.expiresAt && ` - Expires ${format(new Date(completedExport.expiresAt), "PP")}`}
                  </p>
                </div>
                <Button onClick={() => window.open(completedExport.downloadUrl!, '_blank')} data-testid="button-download-data">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            ) : null}
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => requestExportMutation.mutate()}
              disabled={requestExportMutation.isPending || !!pendingExport}
              data-testid="button-request-export"
            >
              {requestExportMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Requesting...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4 mr-2" />
                  Request Data Export
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete Your Account
            </CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data. This action cannot be undone.
              After submitting a deletion request, you have 30 days to cancel before your data is permanently removed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {deletionLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : pendingDeletion ? (
              <div className="flex items-center justify-between p-4 bg-destructive/10 rounded-md">
                <div>
                  <p className="font-medium">Account deletion scheduled</p>
                  <p className="text-sm text-muted-foreground">
                    {pendingDeletion.scheduledDeletionAt && (
                      <>Your account will be deleted on {format(new Date(pendingDeletion.scheduledDeletionAt), "PPP")}</>
                    )}
                  </p>
                  {pendingDeletion.reason && (
                    <p className="text-sm mt-1">Reason: {pendingDeletion.reason}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(pendingDeletion.status)}
                  <Button
                    variant="outline"
                    onClick={() => cancelDeletionMutation.mutate(pendingDeletion.id)}
                    disabled={cancelDeletionMutation.isPending}
                    data-testid="button-cancel-deletion"
                  >
                    Cancel Deletion
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
          <CardFooter>
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={!!pendingDeletion}
                  data-testid="button-delete-account"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will schedule your account for permanent deletion. You have 30 days to cancel this request.
                    After that, all your data will be permanently removed and cannot be recovered.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <Label htmlFor="reason">Reason for leaving (optional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Help us understand why you're leaving..."
                    value={deletionReason}
                    onChange={(e) => setDeletionReason(e.target.value)}
                    className="mt-2"
                    data-testid="input-deletion-reason"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground"
                    onClick={() => requestDeletionMutation.mutate(deletionReason)}
                    disabled={requestDeletionMutation.isPending}
                    data-testid="button-confirm-delete"
                  >
                    {requestDeletionMutation.isPending ? "Submitting..." : "Delete My Account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>

        {(exportRequests && exportRequests.length > 1) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {exportRequests.slice(1).map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                    <div>
                      <p className="text-sm">
                        Requested {format(new Date(request.createdAt), "PPp")}
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
