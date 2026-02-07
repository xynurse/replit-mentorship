import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Clock,
  Search,
  Activity,
  Filter,
} from "lucide-react";
import type { PlatformIssue } from "@shared/schema";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof AlertCircle; badgeVariant: "default" | "secondary" | "destructive" | "outline" }> = {
  INVESTIGATING: { label: "Investigating", color: "text-red-500", icon: Search, badgeVariant: "destructive" },
  IN_PROGRESS: { label: "In Progress", color: "text-yellow-500", icon: Clock, badgeVariant: "secondary" },
  MONITORING: { label: "Monitoring", color: "text-blue-500", icon: Activity, badgeVariant: "outline" },
  RESOLVED: { label: "Resolved", color: "text-green-500", icon: CheckCircle, badgeVariant: "default" },
};

const FILTER_OPTIONS = ["ALL", "INVESTIGATING", "IN_PROGRESS", "MONITORING"] as const;

function formatDate(dateString: string | Date) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dateString: string | Date) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function StatusBoard() {
  const [isOpen, setIsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data: issues = [], dataUpdatedAt } = useQuery<PlatformIssue[]>({
    queryKey: ["/api/platform-status"],
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const activeIssues = issues.filter((i) => i.status !== "RESOLVED");
  const filteredIssues = statusFilter === "ALL" ? issues : issues.filter((i) => i.status === statusFilter);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm transition-colors bg-card/60 dark:bg-white/[0.04] border border-border dark:border-white/10 hover-elevate"
        data-testid="button-status-board-toggle"
        aria-label="Toggle platform status board"
      >
        <div className="flex items-center gap-2">
          {activeIssues.length === 0 ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          )}
          <span className="font-medium text-foreground">Platform Status</span>
          {activeIssues.length > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0" data-testid="badge-active-issues-count">
              {activeIssues.length}
            </Badge>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-2">
        <div
          className="rounded-xl p-4 space-y-3 bg-card/60 dark:bg-white/[0.04] border border-border dark:border-white/10"
          role="region"
          aria-label="Platform status details"
          data-testid="status-board-content"
        >
          {issues.length === 0 ? (
            <div className="flex items-center gap-2 py-3 justify-center" data-testid="status-all-operational">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                All systems operational
              </span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <div className="flex gap-1" role="group" aria-label="Filter issues by status">
                    {FILTER_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setStatusFilter(opt)}
                        className={`text-[11px] px-2 py-0.5 rounded-md transition-colors ${
                          statusFilter === opt
                            ? "bg-primary/15 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        data-testid={`button-filter-${opt.toLowerCase()}`}
                        aria-pressed={statusFilter === opt}
                      >
                        {opt === "ALL" ? "All" : STATUS_CONFIG[opt]?.label || opt}
                      </button>
                    ))}
                  </div>
                </div>
                {dataUpdatedAt > 0 && (
                  <span className="text-[11px] text-muted-foreground" data-testid="text-last-checked">
                    Checked {formatDateTime(new Date(dataUpdatedAt))}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {filteredIssues.map((issue) => {
                  const config = STATUS_CONFIG[issue.status] || STATUS_CONFIG.INVESTIGATING;
                  const StatusIcon = config.icon;
                  return (
                    <div
                      key={issue.id}
                      className="p-3 rounded-lg bg-background/50 dark:bg-white/[0.03] border border-border/50 dark:border-white/5"
                      data-testid={`status-issue-${issue.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <StatusIcon className={`h-3.5 w-3.5 shrink-0 ${config.color}`} />
                            <span className="text-sm font-medium text-foreground truncate">
                              {issue.title}
                            </span>
                          </div>
                          {issue.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed ml-5.5 pl-0.5">
                              {issue.description}
                            </p>
                          )}
                        </div>
                        <Badge variant={config.badgeVariant} className="text-[10px] shrink-0" data-testid={`badge-status-${issue.id}`}>
                          {config.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground ml-5.5 pl-0.5">
                        <span>Reported {formatDate(issue.dateReported)}</span>
                        <span>Updated {formatDateTime(issue.lastUpdated)}</span>
                      </div>
                    </div>
                  );
                })}
                {filteredIssues.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No issues matching this filter
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
