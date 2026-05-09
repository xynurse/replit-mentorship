# Changelog

All notable changes to the SONSIEL Mentorship Platform during the Replit → Vercel migration.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Dates are local to the project owner.

---

## [Unreleased]

### Pending (see [TODO.md](./TODO.md))

- **Phase 2** — Replace socket.io with Ably for real-time messaging, presence, typing indicators, and live notification updates.
- **Phase 3** — Replace Replit's GCS sidecar with Vercel Blob for document storage and profile photos.
- **DNS cutover** — Repoint `mentorship.sonsiel.org` from Replit to Vercel.

---

## [1.0.0] — 2026-05-03 — Phase 1: Vercel deployment

The platform now runs on Vercel Functions with a user-owned Neon Postgres database. Real-time messaging and file storage are temporarily disabled pending Phases 2 and 3.

### Added

- `api/index.ts` Vercel Function entry point that wraps the Express app.
- `server/app.ts` — extracted Express app construction, separate from the local-dev entry.
- `scripts/build-server.ts` — pre-bundles `server/app.ts` to `dist/server.mjs` via esbuild before Vercel's function bundler runs.
- `scripts/seed-prod.ts` — one-shot production seed runner. Replaces the auto-seed-on-boot pattern that ran on every Replit start.
- `scripts/auth-diag.ts` and `scripts/programs-diag.ts` — read-only DB diagnostic helpers.
- `vercel.json` — build, output, function, and rewrite configuration.
- `.env.example` — documents the four required environment variables.
- An admin-only `/api/admin/email-diagnostics` endpoint that reports whether `RESEND_API_KEY` is configured.

### Changed

- **Database**: dumped from Replit-managed Neon and restored into a user-owned Neon project. 59 tables and all 34 user accounts (with scrypt password hashes) verified intact.
- **Email integration**: replaced Replit Connectors-based Resend credential fetch with direct `RESEND_API_KEY` and `RESEND_FROM_EMAIL` environment variables.
- **`getTrustedBaseUrl()`** in [server/email.ts](./server/email.ts) now prefers `APP_URL`, then `VERCEL_PROJECT_PRODUCTION_URL`, then `VERCEL_URL`, with `localhost:5000` as the final fallback.
- **Auto-seed** moved out of the boot path. Run `npm run seed` once after the database is provisioned, instead of on every cold start.
- **Build pipeline**: `npm run build` is now `tsx scripts/build-server.ts && vite build`. The legacy esbuild server bundle is preserved as `npm run build:legacy`.
- **`server/static.ts`** uses `import.meta.dirname` instead of `__dirname` (ESM-safe).
- **`vite.config.ts`** no longer references `@replit/vite-plugin-runtime-error-modal` or other Replit dev plugins.
- **`server/routes.ts`** import for object storage points at `./replit_integrations/object_storage/index` (explicit) instead of the bare directory name. ESM doesn't allow directory imports; this was masked in dev by tsx but failed under Vercel's bundler.
- **`server/index.ts`** is now a local-dev-only entry. It calls `createApp` and conditionally pulls in the Vite middleware. The Vercel function never imports Vite.
- **NurseHack4Health program** soft-deleted (`is_active = false`) and removed from `ensurePrograms()` in `server/auto-seed.ts`. The user-facing program switcher hides inactive programs via `getUserPrograms()`.

### Stubbed (returns no-op responses pending Phases 2 and 3)

- **`server/websocket.ts`** — every export (`setupWebSocket`, `getOnlineUsers`, `isUserOnline`, `emitNotification`, `emitNotificationCountUpdate`) is now a no-op. The original socket.io implementation lives in git history before commit `14d46fc`.
- **Document upload, view, and download routes** still resolve, but the underlying `ObjectStorageService` will throw when its methods are called because the Replit sidecar (`http://127.0.0.1:1106`) is unreachable on Vercel.

### Removed

- The three `@replit/vite-plugin-*` imports from `vite.config.ts` (kept as `devDependencies` for now).
- The Replit-Connectors-based `getCredentials()` flow in `server/email.ts`.
- All `process.env.REPLIT_*` reads from `server/email.ts` and the email-diagnostics route in `server/routes.ts`.

### Fixed

- **`FUNCTION_INVOCATION_FAILED` on every API request** (Phase 1 deploy blocker). Two compounding causes:
  1. ESM directory import in `server/routes.ts` (fixed by appending `/index`).
  2. `server/app.ts` had `await import("./vite")` under the dev-mode branch; esbuild traced the literal string and pulled vite → rollup into the function bundle. Rollup needs platform-specific native binaries that Vercel's `npm install` skipped (`@rollup/rollup-linux-x64-gnu`). Fixed by yanking the vite import out of `createApp` entirely and pre-bundling `server/app.ts` to a single `.mjs` artifact via `scripts/build-server.ts`.

### Security

- `SESSION_SECRET` rotated to a fresh 32-byte hex value before the first Vercel deploy. Store and rotate via `vercel env add SESSION_SECRET production`.
- `.env` and `.vercel` added to `.gitignore`.

### Migration / operational notes

- **Source dump** preserved at `/tmp/mentorship-source.dump` (212 KB, custom format) as a safety net for the database cutover. Delete after Phase 3 is verified in production.
- **Replit-managed Neon endpoint** (`ep-sweet-poetry-ahg49omp`) is no longer in the production path but still exists. Auto-suspends after inactivity. Free to leave; nothing depends on it.
- **Vercel project**: `mike-9206s-projects/replit-mentorship`, linked to the `xynurse/replit-mentorship` GitHub repo. Pushes to `main` auto-deploy.

---

## Older history

Everything before commit `14d46fc` predates the migration and is preserved in git. The most recent pre-migration commit was `dc3d854 — Fix notification URL generation and remove debug logs`.
