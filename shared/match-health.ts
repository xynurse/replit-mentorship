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

/**
 * Minimum gap between nudges for the same pair. Without this, a match that
 * stays quiet would be nudged on every run, which trains people to ignore
 * the mail — the opposite of what a nudge is for.
 */
export const NUDGE_COOLDOWN_DAYS = 7;

/**
 * Grace period after a match starts before it can be nudged. A pair matched
 * this morning has not "gone quiet"; nudging them immediately is noise.
 */
export const NUDGE_GRACE_DAYS = 3;

export type NudgeReason = "no_message" | "no_meeting" | "never_started";

export const NUDGE_REASON_LABELS: Record<NudgeReason, string> = {
  never_started: "No contact yet",
  no_message: `No message in ${NUDGE_NO_MESSAGE_DAYS}+ days`,
  no_meeting: `No meeting in ${NUDGE_NO_MEETING_DAYS}+ days`,
};

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

export interface NudgeCandidateInput extends MatchActivity {
  /** When the pair was matched — drives the grace period. */
  startedAt: Date | string | null;
  /** When this pair was last nudged, if ever — drives the cooldown. */
  lastNudgedAt: Date | string | null;
}

export interface NudgeDecision {
  shouldNudge: boolean;
  reasons: NudgeReason[];
  /** Set when `shouldNudge` is false, for preview/debugging. */
  skippedBecause?: "in_grace_period" | "recently_nudged" | "engaged";
}

/**
 * Decide whether a pair should be nudged, and why.
 *
 * Order matters: grace period is checked before cooldown, and both before
 * the activity rules, so a brand-new or recently-nudged pair never produces
 * reasons that a caller might act on by mistake.
 */
export function evaluateNudge(input: NudgeCandidateInput, now: Date = new Date()): NudgeDecision {
  const ageDays = daysSince(input.startedAt, now);
  if (ageDays !== null && ageDays < NUDGE_GRACE_DAYS) {
    return { shouldNudge: false, reasons: [], skippedBecause: "in_grace_period" };
  }

  const sinceNudge = daysSince(input.lastNudgedAt, now);
  if (sinceNudge !== null && sinceNudge < NUDGE_COOLDOWN_DAYS) {
    return { shouldNudge: false, reasons: [], skippedBecause: "recently_nudged" };
  }

  const reasons: NudgeReason[] = [];
  const sinceMessage = daysSince(input.lastMessageAt, now);
  const sinceMeeting = daysSince(input.lastMeetingAt, now);

  if (input.lastMessageAt === null && input.lastMeetingAt === null) {
    reasons.push("never_started");
  } else {
    if (sinceMessage === null || sinceMessage >= NUDGE_NO_MESSAGE_DAYS) reasons.push("no_message");
    if (sinceMeeting === null || sinceMeeting >= NUDGE_NO_MEETING_DAYS) reasons.push("no_meeting");
  }

  if (reasons.length === 0) {
    return { shouldNudge: false, reasons: [], skippedBecause: "engaged" };
  }
  return { shouldNudge: true, reasons };
}
