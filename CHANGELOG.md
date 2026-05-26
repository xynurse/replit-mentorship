# Changelog

All notable changes to the SONSIEL Mentorship Platform during the Replit → Vercel migration.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Dates are local to the project owner.

---

## [Unreleased]

### Pending (see [TODO.md](./TODO.md))

- **Phase 2** — Replace socket.io with Ably for real-time messaging, presence, typing indicators, and live notification updates.
- **DNS cutover** — Repoint `mentorship.sonsiel.org` from Replit to Vercel.
- **Confirm `BLOB_READ_WRITE_TOKEN` is set on Vercel Production + Preview env.** Locally added 2026-05-25; verify Vercel project env shows it with both environment checkmarks.
- **Re-upload program guides through the admin UI** after deploy. The 10 legacy docs were deleted on 2026-05-25 as part of the "start fresh" cleanup (see 1.1.0).

---

## [1.1.0] — 2026-05-25 — Phase 3: Vercel Blob

Replaces the unreachable Replit GCS sidecar (`http://127.0.0.1:1106`) with `@vercel/blob`. Document upload + view + download and profile-photo upload work end-to-end on Vercel — pending `BLOB_READ_WRITE_TOKEN` being provisioned on the project.

### Added

- `server/storage/blob.ts` — Vercel Blob wrapper exposing `streamRequestToBlob` (server-side upload proxy), `streamBlobToResponse` (server-mediated download with ACL preserved upstream), `deleteBlobIfExists`, `blobExists`, and `isBlobUrl`. Per-kind size and content-type limits enforced server-side.
- `POST /api/uploads` — new auth-gated upload route. Accepts `?kind=document|profile-photo&name=<file>` with the raw file as the request body; proxies to Blob via `put()` and returns `{ url, pathname, contentType, size, name }`. Replaces the old `/api/uploads/request-url` + presigned-PUT flow.
- `@vercel/blob` v2 dependency.
- Vercel Blob store `store_yU2vqWCcTiKma2Tc` provisioned on the `replit-mentorship` project (2026-05-25).

### Changed

- `documents.fileUrl` and `users.profileImage` now store full Vercel Blob URLs (e.g. `https://<store>.public.blob.vercel-storage.com/documents/<id>-<filename>`). Existing legacy `objects/uploads/<uuid>` rows continue to be recognized by `isBlobUrl()` as legacy and 404 with a "please re-upload" message until migration runs.
- `/api/documents/:id/view` and `/api/documents/:id/download` now fetch the Blob URL server-side and pipe the response back, preserving the existing ACL model (admin / owner / public / explicit share) unchanged. Inline `viewBlobUrl` Content-Type quirk that motivated the original metadata override is gone — Blob preserves the upload Content-Type faithfully.
- `/api/profile-photo/:userId` is now a backwards-compat shim. For Blob URLs it 302-redirects to the canonical URL; for legacy GCS-style paths it 404s with a helpful message. Front-end avatars read `user.profileImage` directly.
- `ObjectUploader` rewritten as a small click-to-pick component with XHR upload + progress modal. No longer depends on Uppy (`@uppy/aws-s3`, `@uppy/core`, `@uppy/dashboard`, `@uppy/react`).
- `use-upload` hook reduced to a single `uploadFile(file, kind)` helper that POSTs to `/api/uploads`. Removed the old two-step "get presigned URL → PUT to URL" indirection.
- `vercel.json` — dropped the `/objects/(.*)` rewrite (no longer used).

### Removed

- `server/replit_integrations/` (entire directory): `objectStorage.ts`, `objectAcl.ts`, `routes.ts`, `index.ts`. The ACL-via-GCS-metadata scaffold was vestigial (the `ObjectAccessGroupType` enum was empty); the real ACL has always been DB-driven, so nothing functional was lost.
- `@google-cloud/storage`, `google-auth-library`, `@uppy/aws-s3`, `@uppy/core`, `@uppy/dashboard`, `@uppy/react` — uninstalled.
- `/api/uploads/request-url` route — clients now POST to `/api/uploads` directly.

### Security

- The new upload route enforces auth + per-kind size limits (`5 MB` for profile photos, `50 MB` for documents) and a content-type whitelist (`image/jpeg|png|gif|webp` for profile photos). Documents accept any content type, gated by the existing 50 MB max.
- Blob URLs use `access: 'public'` — they're unguessable but anyone with the URL can read. For documents this is safe because the URL only lives in `documents.fileUrl` (never returned to the client; all reads route through `/api/documents/:id/view|download` which enforce ACL before fetching). For profile photos this is by design (avatars are visible to any logged-in user anyway).

### Migration: start fresh (2026-05-25)

Instead of carrying Replit Object Storage files forward, we elected to start fresh. 12 legacy file references existed at the time of cutover:

- **10 document rows deleted** (program track guides + handbooks + code of conduct + mentorship guides). An admin will re-upload these through the new flow post-deploy.
- **2 user profile photos nulled** (`profile_image` set to NULL — users see initials until they re-upload).

No user accounts, applications, cohorts, matches, messages, journal entries, or other relational data was touched. Migration scripts (`scripts/migrate-blobs.ts`, `scripts/count-legacy-files.ts`, `scripts/clean-legacy-files.ts`) were authored, used, and then removed since they were single-use.

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
