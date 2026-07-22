/**
 * Match health — shared definition of when a mentorship pair has gone quiet.
 *
 * The admin dashboard, the status badges, and the automated nudge job all
 * import from here so they can never disagree about what "at risk" means.
 * Change a threshold once and every consumer follows.
 */

/** Days without any activity before a match is flagged at-risk. */
export const MATCH_AT_RISK_DAYS = 14;

/** Days without any activity before a match is worth watching. */
export const MATCH_WATCH_DAYS = 7;

/** Days without a message before the pair gets a check-in nudge. */
export const NUDGE_NO_MESSAGE_DAYS = 7;

/** Days without a logged meeting before the pair gets a check-in nudge. */
export const NUDGE_NO_MEETING_DAYS = 14;

export type MatchHealthLevel = "healthy" | "watch" | "at_risk" | "no_activity";

export interface MatchActivity {
  /** Most recent non-deleted message in the pair's conversation. */
  lastMessageAt: Date | string | null;
  /** Most recent meeting with an actual (not merely scheduled) date. */
  lastMeetingAt: Date | string | null;
}

function toTime(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

/** Most recent of message or meeting activity, or null if the pair never engaged. */
export function lastActivityAt(activity: MatchActivity): Date | null {
  const times = [toTime(activity.lastMessageAt), toTime(activity.lastMeetingAt)]
    .filter((t): t is number => t !== null);
  return times.length ? new Date(Math.max(...times)) : null;
}

/** Whole days elapsed since `date`, or null if there is no date. */
export function daysSince(date: Date | string | null | undefined, now: Date = new Date()): number | null {
  const time = toTime(date ?? null);
  if (time === null) return null;
  return Math.floor((now.getTime() - time) / 86_400_000);
}

/**
 * Classify a pair. A match that has never exchanged a message or logged a
 * meeting is `no_activity` rather than `at_risk` — the distinction matters,
 * because a brand-new match hasn't gone quiet, it just hasn't started, and
 * admins act on those two cases differently.
 */
export function matchHealthLevel(activity: MatchActivity, now: Date = new Date()): MatchHealthLevel {
  const last = lastActivityAt(activity);
  if (!last) return "no_activity";

  const days = daysSince(last, now) ?? 0;
  if (days >= MATCH_AT_RISK_DAYS) return "at_risk";
  if (days >= MATCH_WATCH_DAYS) return "watch";
  return "healthy";
}

export const MATCH_HEALTH_LABELS: Record<MatchHealthLevel, string> = {
  healthy: "Active",
  watch: "Quiet",
  at_risk: "At risk",
  no_activity: "Not started",
};
