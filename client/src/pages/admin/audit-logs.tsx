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
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  CalendarIcon,
  Download,
  User,
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
  timestamp: string;
}

interface AuditLogResponse {
  logs: AuditLog[];
  totalCount: number;
  limit: number;
  offset: number;
}

interface SafeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

const actionCategories: Record<string, string[]> = {
  "Authentication": [
    "LOGIN_SUCCESS", "LOGIN_FAILED", "LOGOUT",
    "PASSWORD_RESET_REQUESTED", "PASSWORD_RESET_COMPLETED", "PASSWORD_CHANGED",
    "EMAIL_VERIFICATION", "EMAIL_CHANGE",
    "ACCOUNT_LOCKED", "ACCOUNT_UNLOCKED",
    "SESSION_EXPIRED", "SESSION_INVALIDATED",
  ],
  "Users": [
    "USER_CREATED", "USER_UPDATED", "USER_DELETED",
    "USER_ROLE_CHANGED", "USER_ACTIVATED", "USER_DEACTIVATED",
    "PROFILE_UPDATED", "PREFERENCES_CHANGED",
  ],
  "Cohorts & Applications": [
    "COHORT_CREATED", "COHORT_UPDATED", "COHORT_DELETED", "COHORT_STATUS_CHANGED",
    "APPLICATION_SUBMITTED", "APPLICATION_REVIEWED", "APPLICATION_APPROVED", "APPLICATION_REJECTED",
  ],
  "Matches": [
    "MATCH_CREATED", "MATCH_UPDATED", "MATCH_ACTIVATED", "MATCH_TERMINATED",
  ],
  "Documents": [
    "DOCUMENT_UPLOADED", "DOCUMENT_UPDATED", "DOCUMENT_DELETED",
    "DOCUMENT_SHARED", "DOCUMENT_ACCESS_REVOKED", "DOCUMENT_DOWNLOADED", "DOCUMENT_VIEWED",
  ],
  "Tasks & Goals": [
    "TASK_CREATED", "TASK_UPDATED", "TASK_COMPLETED",
    "GOAL_CREATED", "GOAL_UPDATED", "GOAL_COMPLETED",
  ],
  "Messages": [
    "MESSAGE_SENT", "MESSAGE_EDITED", "MESSAGE_DELETED",
  ],
  "Communications": [
    "NOTIFICATION_SENT", "EMAIL_SENT",
  ],
  "System": [
    "SETTINGS_CHANGED", "BULK_OPERATION_PERFORMED", "DATA_EXPORTED", "REPORT_GENERATED",
    "SCHEDULED_JOB_EXECUTED", "ERROR_OCCURRED",
  ],
};

const allActionTypes = Object.values(actionCategories).flat();

const resourceTypes = [
  "USER", "SESSION", "COHORT", "TRACK", "APPLICATION", "MATCH", "MEETING",
  "DOCUMENT", "FOLDER", "MESSAGE", "CONVERSATION", "TASK", "GOAL", "MILESTONE",
  "NOTIFICATION", "SETTINGS", "SYSTEM",
];

export default function AuditLogs() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>("");
  const [successFilter, setSuccessFilter] = useState<string>("");
  const [userFilter, setUserFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [page, setPage] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const limit = 25;

  const { data: usersData } = useQuery<SafeUser[]>({
    queryKey: ["/api/users"],
  });

  const queryParams = new URLSearchParams();
  if (search) queryParams.append("search", search);
  if (actionFilter && actionFilter !== "all") queryParams.append("action", actionFilter);
  if (resourceTypeFilter && resourceTypeFilter !== "all") queryParams.append("resourceType", resourceTypeFilter);
  if (successFilter && successFilter !== "all") queryParams.append("success", successFilter);
  if (userFilter && userFilter !== "all") queryParams.append("actorId", userFilter);
  if (startDate) queryParams.append("startDate", new Date(startDate).toISOString());
  if (endDate) queryParams.append("endDate", new Date(endDate + "T23:59:59").toISOString());
  queryParams.append("limit", limit.toString());
  queryParams.append("offset", (page * limit).toString());

  const { data, isLoading, refetch } = useQuery<AuditLogResponse>({
    queryKey: ["/api/audit-logs", search, actionFilter, resourceTypeFilter, successFilter, userFilter, startDate, endDate, page],
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
    setUserFilter("");
    setStartDate("");
    setEndDate("");
    setPage(0);
  };

  const hasActiveFilters = search || actionFilter || resourceTypeFilter || successFilter || userFilter || startDate || endDate;

  const getActionBadgeVariant = (action: string): "default" | "destructive" | "secondary" | "outline" => {
    if (action.includes("DELETED") || action.includes("FAILED") || action.includes("REJECTED") || action.includes("LOCKED") || action === "ERROR_OCCURRED") {
      return "destructive";
    }
    if (action.includes("CREATED") || action.includes("SUCCESS") || action.includes("APPROVED") || action.includes("COMPLETED") || action.includes("ACHIEVED") || action.includes("ACTIVATED") || action.includes("UNLOCKED") || action === "EMAIL_VERIFICATION") {
      return "default";
    }
    if (action.includes("EMAIL_SENT") || action.includes("NOTIFICATION_SENT")) {
      return "outline";
    }
    return "secondary";
  };

  const formatAction = (action: string) => {
    return action.replace(/_/g, " ");
  };

  const exportLogs = () => {
    if (!data?.logs) return;
    const csvRows = [
      ["Timestamp", "Actor Email", "Actor Role", "Action", "Resource Type", "Resource Name", "Status", "IP Address", "Error Message", "Metadata"].join(","),
      ...data.logs.map(log => [
        format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss"),
        log.actorEmail || log.actorType,
        log.actorRole || "-",
        log.action,
        log.resourceType,
        log.resourceName || "-",
        log.success ? "Success" : "Failed",
        log.ipAddress || "-",
        log.errorMessage || "-",
        log.metadata ? JSON.stringify(log.metadata) : "-",
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd-HHmmss")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">Audit Logs</h1>
            <p className="text-muted-foreground">
              Track all system activities and user actions
              {data?.totalCount !== undefined && (
                <span className="ml-2">({data.totalCount.toLocaleString()} total entries)</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportLogs}
              disabled={!data?.logs?.length}
              data-testid="button-export"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
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
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="text-sm text-muted-foreground mb-1 block">Search</label>
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
              <div className="w-[220px]">
                <label className="text-sm text-muted-foreground mb-1 block">Filter by User</label>
                <Select value={userFilter} onValueChange={(v) => { setUserFilter(v); setPage(0); }}>
                  <SelectTrigger data-testid="select-user">
                    <User className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {usersData?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[200px]">
                <label className="text-sm text-muted-foreground mb-1 block">Action</label>
                <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(0); }}>
                  <SelectTrigger data-testid="select-action">
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {Object.entries(actionCategories).map(([category, actions]) => (
                      <div key={category}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{category}</div>
                        {actions.map((action) => (
                          <SelectItem key={action} value={action}>{formatAction(action)}</SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[150px]">
                <label className="text-sm text-muted-foreground mb-1 block">Resource</label>
                <Select value={resourceTypeFilter} onValueChange={(v) => { setResourceTypeFilter(v); setPage(0); }}>
                  <SelectTrigger data-testid="select-resource-type">
                    <SelectValue placeholder="All Resources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Resources</SelectItem>
                    {resourceTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[130px]">
                <label className="text-sm text-muted-foreground mb-1 block">Status</label>
                <Select value={successFilter} onValueChange={(v) => { setSuccessFilter(v); setPage(0); }}>
                  <SelectTrigger data-testid="select-success">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="true">Success</SelectItem>
                    <SelectItem value="false">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-end mt-3">
              <div className="w-[180px]">
                <label className="text-sm text-muted-foreground mb-1 block">From Date</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
                    className="pl-9"
                    data-testid="input-start-date"
                  />
                </div>
              </div>
              <div className="w-[180px]">
                <label className="text-sm text-muted-foreground mb-1 block">To Date</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
                    className="pl-9"
                    data-testid="input-end-date"
                  />
                </div>
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} data-testid="button-clear-filters">
                  Clear All Filters
                </Button>
              )}
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
                      No audit logs found matching your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.logs.map((log) => (
                    <TableRow key={log.id} data-testid={`row-audit-log-${log.id}`}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {format(new Date(log.timestamp), "MMM d, yyyy HH:mm:ss")}
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
                          {formatAction(log.action)}
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
                                    <p className="text-sm">{formatAction(log.action)}</p>
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
                                    <label className="text-sm font-medium text-muted-foreground">Resource Name</label>
                                    <p className="text-sm">{log.resourceName || "-"}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Resource ID</label>
                                    <p className="text-sm font-mono text-xs">{log.resourceId || "-"}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                                    <p className="text-sm">{log.ipAddress || "-"}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
                                    <p className="text-sm">{format(new Date(log.timestamp), "PPpp")}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                                    <p className="text-sm">{log.success ? "Success" : "Failed"}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Actor Type</label>
                                    <p className="text-sm">{log.actorType}</p>
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
