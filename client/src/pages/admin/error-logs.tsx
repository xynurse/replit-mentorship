import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  ChevronLeft,
  ChevronRight,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ErrorLog {
  id: string;
  errorType: string;
  errorCode: string | null;
  message: string;
  stackTrace: string | null;
  userId: string | null;
  userEmail: string | null;
  requestPath: string | null;
  requestMethod: string | null;
  requestBody: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  resolved: boolean;
  resolvedBy: string | null;
  resolvedAt: string | null;
  resolutionNotes: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

interface ErrorLogResponse {
  logs: ErrorLog[];
  totalCount: number;
  limit: number;
  offset: number;
}

const errorTypes = [
  "VALIDATION_ERROR",
  "AUTHENTICATION_ERROR",
  "AUTHORIZATION_ERROR",
  "NOT_FOUND_ERROR",
  "DATABASE_ERROR",
  "EXTERNAL_API_ERROR",
  "INTERNAL_ERROR",
  "RATE_LIMIT_ERROR",
];

export default function ErrorLogs() {
  const [resolvedFilter, setResolvedFilter] = useState<string>("");
  const [errorTypeFilter, setErrorTypeFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);
  const limit = 20;
  const { toast } = useToast();

  const queryParams = new URLSearchParams();
  if (resolvedFilter) queryParams.append("resolved", resolvedFilter);
  if (errorTypeFilter) queryParams.append("errorType", errorTypeFilter);
  queryParams.append("limit", limit.toString());
  queryParams.append("offset", (page * limit).toString());

  const { data, isLoading, refetch } = useQuery<ErrorLogResponse>({
    queryKey: ["/api/error-logs", resolvedFilter, errorTypeFilter, page],
    queryFn: async () => {
      const res = await fetch(`/api/error-logs?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch error logs");
      return res.json();
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/error-logs/${id}/resolve`);
    },
    onSuccess: () => {
      toast({ title: "Error marked as resolved" });
      queryClient.invalidateQueries({ queryKey: ["/api/error-logs"] });
    },
    onError: () => {
      toast({ title: "Failed to resolve error", variant: "destructive" });
    },
  });

  const totalPages = data ? Math.ceil(data.totalCount / limit) : 0;

  const clearFilters = () => {
    setResolvedFilter("");
    setErrorTypeFilter("");
    setPage(0);
  };

  const getErrorTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "INTERNAL_ERROR":
      case "DATABASE_ERROR":
        return "destructive";
      case "VALIDATION_ERROR":
      case "AUTHENTICATION_ERROR":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold" data-testid="text-page-title">Error Logs</h1>
            <p className="text-muted-foreground">
              Monitor and resolve system errors
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
              <Select value={errorTypeFilter} onValueChange={(v) => { setErrorTypeFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[180px]" data-testid="select-error-type">
                  <SelectValue placeholder="Error Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {errorTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={resolvedFilter} onValueChange={(v) => { setResolvedFilter(v); setPage(0); }}>
                <SelectTrigger className="w-[130px]" data-testid="select-resolved">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="false">Unresolved</SelectItem>
                  <SelectItem value="true">Resolved</SelectItem>
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
                  <TableHead>Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : data?.logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No error logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.logs.map((log) => (
                    <TableRow key={log.id} data-testid={`row-error-log-${log.id}`}>
                      <TableCell className="text-sm">
                        {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getErrorTypeBadgeVariant(log.errorType)} className="text-xs">
                          {log.errorType.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm truncate max-w-[250px] block">
                          {log.message}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.requestMethod && log.requestPath ? (
                          <span>{log.requestMethod} {log.requestPath}</span>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.userEmail || "-"}
                      </TableCell>
                      <TableCell>
                        {log.resolved ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
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
                            <DialogContent className="max-w-3xl max-h-[80vh]">
                              <DialogHeader>
                                <DialogTitle>Error Details</DialogTitle>
                              </DialogHeader>
                              <ScrollArea className="max-h-[60vh]">
                                <div className="space-y-4 p-1">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Error Type</label>
                                      <p className="text-sm">{log.errorType.replace(/_/g, " ")}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Error Code</label>
                                      <p className="text-sm">{log.errorCode || "-"}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Request</label>
                                      <p className="text-sm">{log.requestMethod} {log.requestPath}</p>
                                    </div>
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">User</label>
                                      <p className="text-sm">{log.userEmail || "-"}</p>
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

                                  <div>
                                    <label className="text-sm font-medium text-muted-foreground">Message</label>
                                    <p className="text-sm mt-1 p-3 bg-muted rounded-md">{log.message}</p>
                                  </div>

                                  {log.stackTrace && (
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Stack Trace</label>
                                      <pre className="mt-1 p-3 rounded-md bg-muted text-xs overflow-x-auto whitespace-pre-wrap">
                                        {log.stackTrace}
                                      </pre>
                                    </div>
                                  )}

                                  {log.requestBody && (
                                    <div>
                                      <label className="text-sm font-medium text-muted-foreground">Request Body</label>
                                      <pre className="mt-1 p-3 rounded-md bg-muted text-xs overflow-x-auto">
                                        {JSON.stringify(log.requestBody, null, 2)}
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

                                  {log.resolved && (
                                    <div className="border-t pt-4">
                                      <h4 className="font-medium mb-2">Resolution Info</h4>
                                      <div className="grid grid-cols-2 gap-4">
                                        <div>
                                          <label className="text-sm font-medium text-muted-foreground">Resolved At</label>
                                          <p className="text-sm">{log.resolvedAt ? format(new Date(log.resolvedAt), "PPpp") : "-"}</p>
                                        </div>
                                        <div>
                                          <label className="text-sm font-medium text-muted-foreground">Notes</label>
                                          <p className="text-sm">{log.resolutionNotes || "-"}</p>
                                        </div>
                                      </div>
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
                          {!log.resolved && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => resolveMutation.mutate(log.id)}
                              disabled={resolveMutation.isPending}
                              data-testid={`button-resolve-${log.id}`}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
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
