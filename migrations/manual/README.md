# Hand-applied production DDL

This project manages schema with `drizzle-kit push` (`npm run db:push`) rather than
versioned migrations — `migrations/` holds a drizzle snapshot and journal but no
`.sql` files, and there is no `drizzle-kit migrate` step in the deploy.

That works for most changes, but leaves no trace of DDL applied by hand to production.
This folder is that trace. Each file is named `YYYY-MM-DD_short_name.sql`, is
idempotent, and records something already run (or waiting to be run) against
production.

These files are **not** picked up by drizzle-kit. They are deliberately outside the
migrations root so they can never collide with `drizzle-kit generate` numbering.

## Applying enum changes

`scripts/sync-enums.ts` compares every `pgEnum` in `shared/schema.ts` against the
target database and adds missing values. It is dry-run by default and only ever adds —
it never drops a value or a type.

```bash
TARGET_DATABASE_URL='postgres://...' npx tsx scripts/sync-enums.ts
TARGET_DATABASE_URL='postgres://...' npx tsx scripts/sync-enums.ts --apply
```

It deliberately does not read `DATABASE_URL`. The `DATABASE_URL` in the local `.env`
points at a stale pre-cutover database, not production; production's is stored
Sensitive on Vercel and cannot be read back with `vercel env pull` — get the
connection string from the Neon dashboard.
