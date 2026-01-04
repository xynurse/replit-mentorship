import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Award, Plus, MoreHorizontal, Search, Filter, CheckCircle, XCircle, Clock, Download } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Certificate {
  id: string;
  userId: string;
  cohortId: string | null;
  certificateNumber: string;
  status: "PENDING" | "GENERATED" | "DELIVERED" | "REVOKED";
  templateData: Record<string, unknown> | null;
  pdfUrl: string | null;
  verificationUrl: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface Cohort {
  id: string;
  name: string;
}

const statusConfig = {
  PENDING: { label: "Pending", icon: Clock, variant: "secondary" as const },
  GENERATED: { label: "Generated", icon: CheckCircle, variant: "default" as const },
  DELIVERED: { label: "Delivered", icon: CheckCircle, variant: "default" as const },
  REVOKED: { label: "Revoked", icon: XCircle, variant: "destructive" as const },
};

export default function AdminCertificatesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedCohortId, setSelectedCohortId] = useState("");

  const { data: certificates = [], isLoading } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates", statusFilter],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: cohorts = [] } = useQuery<Cohort[]>({
    queryKey: ["/api/cohorts"],
  });

  const issueMutation = useMutation({
    mutationFn: async (data: { userId: string; cohortId?: string }) => {
      return apiRequest("POST", "/api/certificates", {
        userId: data.userId,
        cohortId: data.cohortId || null,
        templateData: {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      setShowIssueDialog(false);
      setSelectedUserId("");
      setSelectedCohortId("");
      toast({ title: "Certificate issued successfully" });
    },
    onError: () => {
      toast({ title: "Failed to issue certificate", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/certificates/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({ title: "Certificate status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const filteredCertificates = certificates.filter((cert) => {
    const matchesStatus = statusFilter === "all" || cert.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      cert.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Unknown User";
  };

  const getCohortName = (cohortId: string | null) => {
    if (!cohortId) return "—";
    const cohort = cohorts.find((c) => c.id === cohortId);
    return cohort?.name || "Unknown Cohort";
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64 mt-1" />
              </div>
            </div>
            <Skeleton className="h-9 w-32" />
          </div>
          <Card>
            <CardContent className="pt-6">
              <Skeleton className="h-96" />
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-primary/10">
            <Award className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Certificate Management</h1>
            <p className="text-muted-foreground">Issue and manage program certificates</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => window.open("/api/export/certificates", "_blank")}
            data-testid="button-export-certificates"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setShowIssueDialog(true)} data-testid="button-issue-certificate">
            <Plus className="h-4 w-4 mr-2" />
            Issue Certificate
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by certificate number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="GENERATED">Generated</SelectItem>
              <SelectItem value="DELIVERED">Delivered</SelectItem>
              <SelectItem value="REVOKED">Revoked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Certificates ({filteredCertificates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCertificates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No certificates found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Certificate Number</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Cohort</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCertificates.map((cert) => {
                  const config = statusConfig[cert.status];
                  return (
                    <TableRow key={cert.id} data-testid={`row-certificate-${cert.id}`}>
                      <TableCell className="font-mono text-sm">
                        {cert.certificateNumber}
                      </TableCell>
                      <TableCell>{getUserName(cert.userId)}</TableCell>
                      <TableCell>{getCohortName(cert.cohortId)}</TableCell>
                      <TableCell>
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {cert.issuedAt
                          ? format(new Date(cert.issuedAt), "MMM d, yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-actions-${cert.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {cert.status !== "DELIVERED" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  updateStatusMutation.mutate({ id: cert.id, status: "DELIVERED" })
                                }
                              >
                                Mark as Delivered
                              </DropdownMenuItem>
                            )}
                            {cert.status !== "REVOKED" && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                  updateStatusMutation.mutate({ id: cert.id, status: "REVOKED" })
                                }
                              >
                                Revoke Certificate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue New Certificate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Recipient</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger data-testid="select-recipient">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cohort (optional)</Label>
              <Select value={selectedCohortId} onValueChange={setSelectedCohortId}>
                <SelectTrigger data-testid="select-cohort">
                  <SelectValue placeholder="Select a cohort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No cohort</SelectItem>
                  {cohorts.map((cohort) => (
                    <SelectItem key={cohort.id} value={cohort.id}>
                      {cohort.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIssueDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                issueMutation.mutate({
                  userId: selectedUserId,
                  cohortId: selectedCohortId || undefined,
                })
              }
              disabled={!selectedUserId || issueMutation.isPending}
              data-testid="button-confirm-issue"
            >
              {issueMutation.isPending ? "Issuing..." : "Issue Certificate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </AdminLayout>
  );
}
