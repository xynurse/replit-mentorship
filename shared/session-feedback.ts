/**
 * Post-meeting session feedback.
 *
 * Each participant can rate a logged meeting (1–5) and leave one short note.
 * Feedback is stored per meeting inside the match's existing jsonb columns —
 * `mentorshipMatches.mentorFeedback` for the mentor's answers,
 * `menteeFeedback` for the mentee's — keyed by meeting-log id.
 *
 * Storing the two sides in separate columns is deliberate: mentor and mentee
 * never write the same row, so their submissions can't clobber each other.
 */

import { z } from "zod";

export const SESSION_RATING_MIN = 1;
export const SESSION_RATING_MAX = 5;

/** One person's feedback for one meeting. */
export interface SessionFeedbackEntry {
  /** 1–5: how productive the session was. */
  rating: number;
  /** Free text: one thing to build on or change next time. */
  wentWell: string;
  submittedAt: string;
}

/** Shape held in each jsonb feedback column: meetingLogId → entry. */
export interface MatchFeedbackStore {
  sessions?: Record<string, SessionFeedbackEntry>;
}

export const sessionFeedbackInputSchema = z.object({
  rating: z.number().int().min(SESSION_RATING_MIN).max(SESSION_RATING_MAX),
  wentWell: z.string().trim().max(1000).optional().default(""),
});

export type SessionFeedbackInput = z.infer<typeof sessionFeedbackInputSchema>;

/** Both sides of one meeting's feedback, for display. */
export interface MeetingFeedbackPair {
  mentor: SessionFeedbackEntry | null;
  mentee: SessionFeedbackEntry | null;
}

/** Safely read a feedback store out of an untyped jsonb column. */
export function readFeedbackStore(value: unknown): MatchFeedbackStore {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as MatchFeedbackStore;
  }
  return {};
}

/** Pull one meeting's entry out of a feedback store. */
export function entryForMeeting(
  store: MatchFeedbackStore,
  meetingId: string,
): SessionFeedbackEntry | null {
  return store.sessions?.[meetingId] ?? null;
}

/** A rating at or below this is worth an admin's attention. */
export const SESSION_LOW_RATING = 2;

export interface SessionFeedbackSummary {
  totalResponses: number;
  averageRating: number | null;
  /** rating (1–5) → count */
  distribution: Record<number, number>;
  /** How many meetings have at least one side's feedback. */
  meetingsWithFeedback: number;
}
