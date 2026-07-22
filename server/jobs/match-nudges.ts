/**
 * Automated match nudges.
 *
 * Finds active mentorship pairs that have gone quiet and sends both people a
 * gentle check-in — an in-app notification plus (unless they've opted out) an
 * email.
 *
 * The rules live in shared/match-health.ts so this job and the admin Match
 * Health dashboard can never disagree about what counts as quiet.
 */

import { storage } from "../storage";
import { sendMatchCheckInEmail } from "../email";
import { getTrustedBaseUrl } from "../email";
import {
  evaluateNudge,
  NUDGE_REASON_LABELS,
  type NudgeReason,
} from "@shared/match-health";

export interface NudgeCandidate {
  matchId: string;
  mentor: { id: string; name: string; email: string };
  mentee: { id: string; name: string; email: string };
  cohortName?: string;
  reasons: NudgeReason[];
  reasonLabels: string[];
  lastMessageAt: Date | null;
  lastMeetingAt: Date | null;
  lastNudgedAt: Date | null;
  daysSinceActivity: number | null;
}

export interface NudgeRunResult {
  dryRun: boolean;
  /** Pairs that met the criteria at the time of the run. */
  candidates: NudgeCandidate[];
  /** Per-recipient delivery outcomes. Empty on a dry run. */
  delivered: {
    matchId: string;
    userId: string;
    email: string;
    notified: boolean;
    emailed: boolean;
    error?: string;
  }[];
  /** Why pairs were passed over, for transparency in the preview. */
  skipped: { matchId: string; because: string }[];
}

function displayName(party: { firstName: string | null; lastName: string | null; email: string }): string {
  const name = [party.firstName, party.lastName].filter(Boolean).join(" ").trim();
  return name || party.email;
}

/**
 * Work out which pairs are due a nudge. Pure read — safe to call for preview.
 */
export async function findNudgeCandidates(now: Date = new Date()): Promise<{
  candidates: NudgeCandidate[];
  skipped: { matchId: string; because: string }[];
}> {
  const health = await storage.getMatchHealth();
  if (health.length === 0) return { candidates: [], skipped: [] };

  const lastNudged = await storage.getLastNudgedAtByMatch(health.map((h) => h.matchId));

  const candidates: NudgeCandidate[] = [];
  const skipped: { matchId: string; because: string }[] = [];

  for (const row of health) {
    const lastNudgedAt = lastNudged.get(row.matchId) ?? null;
    const decision = evaluateNudge(
      {
        lastMessageAt: row.lastMessageAt,
        lastMeetingAt: row.lastMeetingAt,
        startedAt: row.startedAt,
        lastNudgedAt,
      },
      now,
    );

    if (!decision.shouldNudge) {
      skipped.push({ matchId: row.matchId, because: decision.skippedBecause ?? "unknown" });
      continue;
    }

    candidates.push({
      matchId: row.matchId,
      mentor: { id: row.mentor.id, name: displayName(row.mentor), email: row.mentor.email },
      mentee: { id: row.mentee.id, name: displayName(row.mentee), email: row.mentee.email },
      cohortName: row.cohort?.name,
      reasons: decision.reasons,
      reasonLabels: decision.reasons.map((r) => NUDGE_REASON_LABELS[r]),
      lastMessageAt: row.lastMessageAt,
      lastMeetingAt: row.lastMeetingAt,
      lastNudgedAt,
      daysSinceActivity: row.daysSinceActivity,
    });
  }

  return { candidates, skipped };
}

/**
 * Send the nudges.
 *
 * `dryRun` defaults to **true**: this job writes notifications and sends real
 * email to real people, so sending has to be asked for explicitly rather than
 * being what you get by forgetting a flag.
 */
export async function runMatchNudges(options: { dryRun?: boolean; now?: Date } = {}): Promise<NudgeRunResult> {
  const dryRun = options.dryRun ?? true;
  const now = options.now ?? new Date();
  const { candidates, skipped } = await findNudgeCandidates(now);

  const result: NudgeRunResult = { dryRun, candidates, delivered: [], skipped };
  if (dryRun || candidates.length === 0) return result;

  const baseUrl = getTrustedBaseUrl();

  for (const candidate of candidates) {
    const pair = [
      { party: candidate.mentor, role: "MENTOR" as const, partner: candidate.mentee },
      { party: candidate.mentee, role: "MENTEE" as const, partner: candidate.mentor },
    ];

    for (const { party, role, partner } of pair) {
      const outcome = {
        matchId: candidate.matchId,
        userId: party.id,
        email: party.email,
        notified: false,
        emailed: false,
        error: undefined as string | undefined,
      };

      try {
        // The in-app notification doubles as the cooldown record — see
        // storage.getLastNudgedAtByMatch. It must be written even when email
        // is disabled for the user, or a mail-opted-out pair would be nudged
        // in-app on every single run.
        await storage.createNotification({
          userId: party.id,
          type: "MATCH_CHECK_IN",
          title: "Checking in on your mentorship",
          message: `It's been a while since there was activity with ${partner.name}. A quick message is usually all it takes to pick things back up.`,
          priority: "LOW",
          resourceType: "MATCH",
          resourceId: candidate.matchId,
          actionUrl: "/messages",
          data: {
            matchId: candidate.matchId,
            partnerId: partner.id,
            reasons: candidate.reasons,
          },
        });
        outcome.notified = true;

        const pref = await storage.getNotificationPreference(party.id, "MATCH_CHECK_IN");
        const emailAllowed = pref ? pref.emailEnabled !== false && pref.emailFrequency !== "NEVER" : true;

        if (emailAllowed) {
          const sent = await sendMatchCheckInEmail({
            email: party.email,
            recipientName: party.name,
            recipientRole: role,
            partnerName: partner.name,
            reasons: candidate.reasonLabels,
            messagesUrl: `${baseUrl}/messages`,
            dashboardUrl: baseUrl,
          });
          outcome.emailed = sent.success;
          if (!sent.success) outcome.error = sent.error;
        }
      } catch (error: any) {
        outcome.error = error?.message ?? String(error);
      }

      result.delivered.push(outcome);
    }
  }

  return result;
}
