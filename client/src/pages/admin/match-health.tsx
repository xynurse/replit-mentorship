import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, HeartPulse, MessageSquare, RefreshCw, CalendarDays } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge, toneDotClass, type StatusTone } from "@/components/shared/status-badge";
import {
  MATCH_AT_RISK_DAYS,
  MATCH_HEALTH_LABELS,
  MATCH_WATCH_DAYS,
  type MatchHealthLevel,
} from "@shared/match-health";

interface MatchHealthParty {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  profileImage: string | null;
}

interface MatchHealthRow {
  matchId: string;
  status: string | null;
  startedAt: string | null;
  mentor: MatchHealthParty;
  mentee: MatchHealthParty;
  cohort?: { id: string; name: string };
  lastMessageAt: string | null;
  lastMeetingAt: string | null;
  lastActivityAt: string | null;
  messageCount: number;
  meetingCount: number;
  daysSinceMessage: number | null;
  daysSinceMeeting: number | null;
  daysSinceActivity: number | null;
  health: MatchHealthLevel;
}

/**
 * Health level → tone. `no_activity` is neutral rather than alarming: a match
 * created yesterday hasn't gone quiet, it just hasn't started.
 */
const HEALTH_TONES: Record<MatchHealthLevel, StatusTone> = {
  healthy: "success",
  watch: "warning",
  at_risk: "danger",
  no_activity: "neutral",
};

/** Worst-first, so the pairs needing attention are never below the fold. */
const HEALTH_ORDER: MatchHealthLevel[] = ["at_risk", "no_activity", "watch", "healthy"];

function fullName(party: MatchHealthParty): string {
  const name = [party.firstName, party.lastName].filter(Boolean).join(" ").trim();
  return name || party.email;
}

function initials(party: MatchHealthParty): string {
  const first = party.firstName?.[0] ?? "";
  const last = party.lastName?.[0] ?? "";
  return (first + last).toUpperCase() || party.email[0].toUpperCase();
}

function relative(value: string | null): string {
  if (!value) return "Never";
  return formatDistanceToNow(new Date(value), { addSuffix: true });
}

function PartyRow({ party, role }: { party: MatchHealthParty; role: string }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarImage src={party.profileImage || undefined} />
        <AvatarFallback className="text-[10px]">{initials(party)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{fullName(party)}</p>
        <p className="text-xs text-muted-foreground">{role}</p>
      </div>
    </div>
  );
}

function SummaryCard({
  level,
  count,
  active,
  onClick,
}: {
  level: MatchHealthLevel | "all";
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const tone: StatusTone = level === "all" ? "primary" : HEALTH_TONES[level];
  const label = level === "all" ? "Active matches" : MATCH_HEALTH_LABELS[level];

  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md ${
        active ? "border-primary/60" : ""
      }`}
      data-testid={`card-health-${level}`}
    >
      <CardContent className="pt-6">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${toneDotClass(tone)}`} />
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
        <p className="mt-2 text-3xl font-semibold" data-testid={`count-health-${level}`}>
          {count}
        </p>
      </CardContent>
    </Card>
  );
}

export default function AdminMatchHealthPage() {
  const [filter, setFilter] = useState<MatchHealthLevel | "all">("all");
  const [cohortFilter, setCohortFilter] = useState<string>("all");

  const { data: rows = [], isLoading, refetch, isFetching } = useQuery<MatchHealthRow[]>({
    queryKey: ["/api/admin/match-health"],
  });

  const cohorts = useMemo(() => {
    const seen = new Map<string, string>();
    rows.forEach((r) => {
      if (r.cohort) seen.set(r.cohort.id, r.cohort.name);
    });
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [rows]);

  const counts = useMemo(() => {
    const base: Record<MatchHealthLevel, number> = {
      healthy: 0,
      watch: 0,
      at_risk: 0,
      no_activity: 0,
    };
    rows.forEach((r) => {
      base[r.health] += 1;
    });
    return base;
  }, [rows]);

  const visible = useMemo(() => {
    return rows
      .filter((r) => filter === "all" || r.health === filter)
      .filter((r) => cohortFilter === "all" || r.cohort?.id === cohortFilter)
      .sort((a, b) => {
        const byHealth = HEALTH_ORDER.indexOf(a.health) - HEALTH_ORDER.indexOf(b.health);
        if (byHealth !== 0) return byHealth;
        // Within a level, the longest-quiet pair first.
        return (b.daysSinceActivity ?? Infinity) - (a.daysSinceActivity ?? Infinity);
      });
  }, [rows, filter, cohortFilter]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          title="Match Health"
          description={`Engagement recency for every active pair. Flagged at ${MATCH_AT_RISK_DAYS}+ days without a message or meeting.`}
          titleTestId="text-page-title"
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              data-testid="button-refresh"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          }
        />

        {isLoading ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-12" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardContent className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        ) : rows.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={HeartPulse}
                title="No active matches"
                description="Match health appears once pairs are matched and activated."
                action={
                  <Link href="/admin/connections">
                    <Button data-testid="button-go-connections">Go to Connections</Button>
                  </Link>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                level="all"
                count={rows.length}
                active={filter === "all"}
                onClick={() => setFilter("all")}
              />
              {(["at_risk", "watch", "no_activity"] as const).map((level) => (
                <SummaryCard
                  key={level}
                  level={level}
                  count={counts[level]}
                  active={filter === level}
                  onClick={() => setFilter(filter === level ? "all" : level)}
                />
              ))}
            </div>

            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <CardTitle className="text-lg">
                    {visible.length} {visible.length === 1 ? "pair" : "pairs"}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                      <SelectTrigger className="w-[150px]" data-testid="select-health">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All health</SelectItem>
                        {HEALTH_ORDER.map((level) => (
                          <SelectItem key={level} value={level}>
                            {MATCH_HEALTH_LABELS[level]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {cohorts.length > 0 && (
                      <Select value={cohortFilter} onValueChange={setCohortFilter}>
                        <SelectTrigger className="w-[170px]" data-testid="select-cohort">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All cohorts</SelectItem>
                          {cohorts.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {visible.length === 0 ? (
                  <EmptyState
                    icon={Activity}
                    title="No pairs match these filters"
                    description="Try widening the health or cohort filter."
                  />
                ) : (
                  <div className="divide-y border-t">
                    {visible.map((row) => (
                      <div
                        key={row.matchId}
                        className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center"
                        data-testid={`row-match-${row.matchId}`}
                      >
                        <div className="grid flex-1 gap-3 sm:grid-cols-2 min-w-0">
                          <PartyRow party={row.mentor} role="Mentor" />
                          <PartyRow party={row.mentee} role="Mentee" />
                        </div>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 lg:w-[420px] lg:shrink-0">
                          <div className="flex items-center gap-2 text-sm">
                            <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span
                              className="text-muted-foreground"
                              data-testid={`text-last-message-${row.matchId}`}
                            >
                              {relative(row.lastMessageAt)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span
                              className="text-muted-foreground"
                              data-testid={`text-last-meeting-${row.matchId}`}
                            >
                              {relative(row.lastMeetingAt)}
                            </span>
                          </div>
                          <div className="ml-auto flex items-center gap-2">
                            {row.cohort && (
                              <span className="text-xs text-muted-foreground hidden xl:inline">
                                {row.cohort.name}
                              </span>
                            )}
                            <StatusBadge
                              status={row.health}
                              tone={HEALTH_TONES[row.health]}
                              label={MATCH_HEALTH_LABELS[row.health]}
                              data-testid={`badge-health-${row.matchId}`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground">
              Quiet = {MATCH_WATCH_DAYS}+ days since the last message or meeting. At risk ={" "}
              {MATCH_AT_RISK_DAYS}+ days. Not started = no message or meeting ever logged.
            </p>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
