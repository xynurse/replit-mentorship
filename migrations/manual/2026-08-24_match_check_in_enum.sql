-- Add MATCH_CHECK_IN to the notification_type enum.
--
-- Why this is hand-applied: this project manages schema with `drizzle-kit push`
-- (npm run db:push), not versioned migrations, so there is no migration runner to
-- carry this. `push` against production is too blunt for a one-value enum change --
-- it would reconcile every other drift at the same time. This file is the record of
-- what was run; scripts/sync-enums.ts is the safe way to run it.
--
-- Blocks: the match-nudge cron (GET /api/cron/match-nudges, weekly via vercel.json).
-- server/jobs/match-nudges.ts:145 writes a MATCH_CHECK_IN notification. Without this
-- value the enum cast fails, and the first scheduled run throws on every pair.
--
-- Apply BEFORE deploying the cron.
--
-- Idempotent. Postgres 12+ permits ADD VALUE inside a transaction, but the new value
-- cannot be *used* until that transaction commits -- so run this on its own, ahead of
-- any code that writes the value.

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'MATCH_CHECK_IN';
