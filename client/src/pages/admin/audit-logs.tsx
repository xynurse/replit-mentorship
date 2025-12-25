import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  actorId: string | null;
  actorType: string;
  actorEmail: string | null;
  actorRole: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  resourceName: string | null;
  previousState: Record<string, any> | null;
  newState: Record<string, any> | null;
  changedFields: string[] | null;
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  errorMessage: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

interface AuditLogResponse {
  logs: AuditLog[];
  totalCount: number;
  limit: number;
  offset: number;
}

const actionTypes = [
  "LOGIN_SUCCESS", "LOGIN_FAILED", "LOGOUT", "PASSWORD_CHANGED", "PASSWORD_RESET_REQUESTED",
  "USER_CREATED", "USER_UPDATED", "USER_DELETED", "USER_ACTIVATED", "USER_DEACTIVATED",
  "ROLE_CHANGED", "PROFILE_UPDATED", "PROFILE_COMPLETED",
  "COHORT_CREATED", "COHORT_UPDATED", "COHORT_DELETED", "MEMBER_ADDED", "MEMBER_REMOVED",
  "APPLICATION_SUBMITTED", "APPLICATION_APPROVED", "APPLICATION_REJECTED",
  "MATCH_CREATED", "MATCH_UPDATED", "MATCH_ENDED",
  "TASK_CREATED", "TASK_UPDATED", "TASK_DELETED", "TASK_COMPLETED",
  "GOAL_CREATED", "GOAL_UPDATED", "GOAL_DELETED", "GOAL_ACHIEVED",
  "DOCUMENT_UPLOADED", "DOCUMENT_VIEWED", "DOCUMENT_DOWNLOADED", "DOCUMENT_DELETED", "DOCUMENT_SHARED",
  "MESSAGE_SENT", "CONVERSATION_CREATED",
  "NOTIFICATION_SENT", "EMAIL_SENT",
  "SETTINGS_CHANGED", "DATA_EXPORTED",
];

const resourceTypes = [
  "USER", "COHORT", "APPLICATION", "MATCH", "TASK", "GOAL", "DOCUMENT",
  "MESSAGE", "CONVERSATION", "NOTIFICATION", "SYSTEM",
];

export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>("");
  const [successFilter, setSuccessFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const limit = 20;

  const queryParams = new URLSearchParams();
  if (search) queryParams.append("search", search);
  if (actionFilter) queryParams.append("action", actionFilter);
  if (resourceTypeFilter) queryParams.append("resourceType", resourceTypeFilter);
  if (successFilter) queryParams.append("success", successFilter);
  queryParams.append("limit", limit.toString());
  queryParams.append("offset", (page * limit).toString());

  const { data, isLoading, refetch } = useQuery<AuditLogResponse>({
    queryKey: ["/api/audit-logs", search, actionFilter, resourceTypeFilter, successFilter, page],
    queryFn: async () => {
      const res = await fetch(`/api/audit-logs?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch audit logs");
      return res.json();
    },
  });

  const totalPages = data ? Math.ceil(data.totalCount / limit) : 0;

  const clearFilters = () => {
    setSearch("");
    setActionFilter("");
    setResourceTypeFilter("");
    setSuccessFilter("");
    setPage(0);
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("DELETED") || action.includes("FAILED") || action.includes("REJECTED")) {
      return "destructive";
    }
    if (action.includes("CREATED") || action.includes("SUCCESS") || action.includes("APPROVED") || action.includes("COMPLETED") || action.includes("ACHIEVED")) {
      return "default";
    }
    return "secondary";
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">Audit Logs</h1>
            <p className="text-muted-foreground">
              Track all system activities and user actions
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email, resource name..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(0);
                    }}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>
              </div>
              <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[180px]" data-testid="select-action">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {actionTypes.map((action) => (
                    <SelectItem key={action} value={action}>{action.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={resourceTypeFilter} onValueChange={(v) => { setResourceTypeFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[150px]" data-testid="select-resource-type">
                  <SelectValue placeholder="Resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  {resourceTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={successFilter} onValueChange={(v) => { setSuccessFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[130px]" data-testid="select-success">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Success</SelectItem>
                  <SelectItem value="false">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" onClick={clearFilters} data-testid="button-clear-filters">
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="w-[60px]">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : data?.logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.logs.map((log) => (
                    <TableRow key={log.id} data-testid={`row-audit-log-${log.id}`}>
                      <TableCell className="text-sm">
                        {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {log.actorEmail || log.actorType}
                          </span>
                          {log.actorRole && (
                            <span className="text-xs text-muted-foreground">{log.actorRole}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)} className="text-xs">
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm">{log.resourceType}</span>
                          {log.resourceName && (
                            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                              {log.resourceName}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.ipAddress || "-"}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedLog(log)}
                              data-testid={`button-view-${log.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh]">
                            <DialogHeader>
                              <DialogTitle>Audit Log Details</DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="max-h-[60vh]">
                              <div className="space-y-4 p-1">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Action</label>
                                    <p className="text-sm">{log.action.replace(/_/g, " ")}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Resource Type</label>
                                    <p className="text-sm">{log.resourceType}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Actor</label>
                                    <p className="text-sm">{log.actorEmail || log.actorType}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Actor Role</label>
                                    <p className="text-sm">{log.actorRole || "-"}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                                    <p className="text-sm">{log.ipAddress || "-"}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
                                    <p className="text-sm">{format(new Date(log.createdAt), "PPpp")}</p>
                                  </div>
                                </div>

                                {log.changedFields && log.changedFields.length > 0 && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Changed Fields</label>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {log.changedFields.map((field) => (
                                        <Badge key={field} variant="outline" className="text-xs">
                                          {field}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {log.previousState && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Previous State</label>
                                    <pre className="mt-1 p-3 rounded-md bg-muted text-xs overflow-x-auto">
                                      {JSON.stringify(log.previousState, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {log.newState && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">New State</label>
                                    <pre className="mt-1 p-3 rounded-md bg-muted text-xs overflow-x-auto">
                                      {JSON.stringify(log.newState, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {log.metadata && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Metadata</label>
                                    <pre className="mt-1 p-3 rounded-md bg-muted text-xs overflow-x-auto">
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {log.errorMessage && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Error Message</label>
                                    <p className="text-sm text-destructive mt-1">{log.errorMessage}</p>
                                  </div>
                                )}

                                {log.userAgent && (
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">User Agent</label>
                                    <p className="text-sm text-muted-foreground break-all">{log.userAgent}</p>
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {page * limit + 1} - {Math.min((page + 1) * limit, data?.totalCount || 0)} of {data?.totalCount} entries
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                data-testid="button-prev-page"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                data-testid="button-next-page"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
