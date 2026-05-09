# TODO — Path to Production on Vercel

What's left to ship the migrated SONSIEL Mentorship Platform end-to-end on Vercel under `mentorship.sonsiel.org`.

Items are ordered by **what should happen first**. Each section calls out the why, the work, the verification step, and rough effort.

---

## P0 — Phase 3: Vercel Blob (file storage)

**Why first.** Profile photos render on every page, and the document library is a flagship feature. Both are silently broken in Phase 1 because the Replit GCS sidecar (`http://127.0.0.1:1106`) is unreachable on Vercel. Fixing this clears the largest blast radius for end users.

**Effort:** ~3 hours.

### Work

- [ ] Provision Vercel Blob on the `replit-mentorship` project (Vercel dashboard → Storage → Create Blob store, or `vercel blob add`).
- [ ] Confirm `BLOB_READ_WRITE_TOKEN` is auto-injected into production + preview env.
- [ ] Add `@vercel/blob` to `dependencies`.
- [ ] Replace `server/replit_integrations/object_storage/objectStorage.ts` with a thin wrapper around `@vercel/blob`:
  - `getObjectEntityUploadURL()` → `put()` with `access: 'public'` or signed URLs depending on doc visibility
  - `getObjectEntityFile(path)` → return Blob URL or stream
  - `downloadObject(file, res)` → stream from Blob to response
  - Preserve the existing `ObjectAclPolicy` model in our DB (Blob doesn't have ACLs; we enforce them in `accessValidator`).
- [ ] Update the four call sites in `server/routes.ts`:
  - line ~1597: profile photo download
  - line ~3204: document view
  - line ~3271: document download
  - line ~3038: `registerObjectStorageRoutes(app, requireAuth, validateDocumentAccess)`
- [ ] Decide on profile photo URL convention:
  - **Recommended:** store full Blob public URLs in `users.profile_image`; fix the few client components that still expect a relative `/objects/...` path.
  - Alternative: keep `/api/profile-photo/:id` as an indirection.
- [ ] Update Uppy upload flow on the client (`client/src/components/ObjectUploader.tsx` and `client/src/hooks/use-upload.ts`) — Vercel Blob client uploads use a different presigned-URL flow than GCS.
- [ ] Drop or repoint `/objects/(.*)` rewrite in `vercel.json`.
- [ ] Delete `server/replit_integrations/` once everything compiles without it.

### Verification

- [ ] Upload a document as an admin, then view + download it as a mentee.
- [ ] Set a profile photo on a test account; refresh the dashboard and confirm the avatar renders.
- [ ] Confirm that a user without permission cannot download a private document (ACL still enforced).

### Migrating existing files (one-time)

If existing documents in production should carry over:

- [ ] Inventory current Replit Object Storage entries (the Replit dashboard has a list).
- [ ] Bulk-download to local disk via the Replit storage panel.
- [ ] Bulk-upload to Vercel Blob via a small script (`scripts/migrate-blobs.ts` — TBD).
- [ ] Update `documents.fileUrl` rows to the new Blob URLs.

If the document library hasn't been heavily used yet, **skipping this and starting fresh is acceptable**; existing rows will fail to load but no data is lost.

---

## P0 — Phase 2: Ably (real-time stack)

**Why next.** REST-based messaging works, so this is polish, not blocker — but the client console is currently flooded with reconnect attempts to a non-existent socket.io server, and live notifications never push. Ably restores all of that with a managed service.

**Effort:** ~3 hours.

### Work

- [ ] Sign up at https://ably.com (free tier: 6M messages/month).
- [ ] Create an app for the mentorship platform; capture the API key.
- [ ] Set `ABLY_API_KEY` in Vercel production + preview.
- [ ] Add `ably` to `dependencies`.
- [ ] Replace `server/websocket.ts` with an Ably-server module:
  - `emitNotification(userId, payload)` → `realtime.channels.get('user:' + userId).publish('notification', payload)`
  - `emitNotificationCountUpdate(userId, count)` → channel `user:<id>`, event `notification:count`
  - The 14 socket.io events from the original implementation map onto Ably channels:
    - `conversation:<id>` channel — events `message:new`, `message:updated`, `message:deleted`, `message:reaction`, `typing:update`, `messages:read`
    - `user:<id>` channel — events `notification:unread`, `notification:count`, `notification:new`
    - presence on `online` channel — for user-online/user-offline
- [ ] Add a server route that mints Ably tokens scoped to the authenticated user (`POST /api/ably/auth`). Use `Realtime.tokens.requestToken({ clientId: req.user.id, capability: { ... } })`.
- [ ] Replace `socket.io-client` usage in:
  - `client/src/hooks/use-messaging.tsx` — subscribe to `conversation:<id>` and `user:<id>` channels.
  - `client/src/components/notification-bell.tsx` — subscribe to `user:<id>`.
- [ ] Remove `socket.io` and `socket.io-client` from `package.json`.
- [ ] Delete `server/websocket.ts` Phase 1 stub.

### Verification

- [ ] Two browsers logged in as different users in the same conversation: typing in one shows the typing indicator in the other within 1s.
- [ ] Sending a message in one shows up in the other without a page refresh.
- [ ] Triggering an admin action that creates a notification (e.g., assign a task) updates the recipient's notification bell badge live.

---

## P1 — DNS cutover

**Why P1, not P0.** Don't repoint `mentorship.sonsiel.org` until P3 and P2 are done — otherwise real users will land on a broken document library and console-flooded UI on the live domain.

**Effort:** ~15 minutes of work + DNS propagation time (5 min – 24 h).

### Work

- [x] Add `mentorship.sonsiel.org` as a domain on the Vercel project (already done on 2026-05-03).
- [ ] At the DNS registrar (Google Cloud DNS, per current `ns-cloud-b*.googledomains.com` nameservers), add a CNAME:
  - `mentorship` → `cname.vercel-dns.com.`
  - TTL 3600
  - **Or** an A record: `mentorship` → `76.76.21.21`
- [ ] If a `mentorship` record already exists pointing at Replit (e.g., `*.replit.app`), update it in place rather than creating a duplicate.
- [ ] Wait for Vercel's domain-verification check to flip to ✅ in the dashboard.
- [ ] Vercel will auto-issue an SSL cert via Let's Encrypt.
- [ ] Set `APP_URL=https://mentorship.sonsiel.org` in Vercel production env. This makes password-reset and notification email links use the canonical domain.
- [ ] `curl https://mentorship.sonsiel.org/api/user` should return `Unauthorized` (HTTP 401) — same as the `.vercel.app` URL.

### Communications

- [ ] Notify users (mentors + mentees + admins) of any expected downtime during cutover. With CNAME-based DNS this should be near-zero, but Replit will stop responding the moment the record propagates.

---

## P2 — Cleanup after Phase 2 + 3

Once both phases are live and verified:

- [ ] Delete `server/replit_integrations/` (entire directory).
- [ ] Delete the now-dead websocket stub (`server/websocket.ts` is replaced by the Ably module).
- [ ] Drop unused dependencies: `socket.io`, `socket.io-client`, `@google-cloud/storage`, `@uppy/aws-s3` (if Uppy switched to a different transport for Blob uploads).
- [ ] Drop the three `@replit/vite-plugin-*` from `devDependencies`.
- [ ] Delete `cookies.txt` and `prod_cookies.txt` from the repo root (Replit-era debug artifacts).
- [ ] Delete `production-migration.sql` (replaced by `npm run db:push` + `npm run seed`).
- [ ] Delete `.replit` and `replit.md` (no longer the canonical home).
- [ ] Delete the `script/build.ts` (legacy esbuild bundle for self-hosted Node) and the `build:legacy` npm script if not needed.
- [ ] Delete `/tmp/mentorship-source.dump` (one-time migration safety net).
- [ ] Drop the Replit-managed Neon project from Neon dashboard (no longer in use).
- [ ] Update `DEPLOYMENT_GUIDE.md` to reflect Vercel as the primary host (or replace it entirely with this `FEATURES.md` + `CHANGELOG.md` pair).

---

## P3 — Codebase hygiene

The migration surfaced several pre-existing issues. Not blocking, but worth addressing.

### Pre-existing TypeScript errors

These existed before the migration and survive only because `tsx` and Vercel's @vercel/node build skip strict type-checking:

- [ ] `client/src/pages/admin/applications.tsx:233` — `Type 'unknown' is not assignable to type 'ReactNode'`.
- [ ] `client/src/pages/documents.tsx:777, 1002` — `Set<string>` iteration without `--downlevelIteration`.
- [ ] `client/src/pages/journal.tsx:216–218` — referencing `notes`, `durationMinutes`, `status` on a meeting type that doesn't have those fields.
- [ ] `server/audit.ts:35` — same `Set` iteration issue.
- [ ] `server/routes.ts:3451–3452` — `parentId` not in folder insert schema.
- [ ] `server/storage.ts:1805, 2709, 3826` — multiple type mismatches in survey insert and platform-issue status comparison.

Run `npm run check` to see the current list. Fix one batch at a time; each fix is small.

### Bundle size

- [ ] `pdf-export-Bik-HkE3.js` is 596 KB minified. Consider lazy-loading the PDF flow rather than including jspdf in the main bundle.
- [ ] `BarChart-BMNgOxqN.js` is 390 KB. Recharts is heavy; route-level code-splitting helps.

### Dependencies

- [ ] `npm audit` reports 27 vulnerabilities (3 low, 10 moderate, 12 high, 2 critical) — most are transitive. Review and patch what's reachable.
- [ ] `bufferutil` is in `optionalDependencies`; verify it's still needed (it speeds up websocket frame parsing — irrelevant once socket.io is removed).

### Observability

- [ ] Wire up Vercel Logs to a long-term sink (Datadog, Logtail, or just S3 archival).
- [ ] Add error-boundary reporting on the client (Sentry or similar). The current admin error log only captures server-side exceptions.

---

## Open questions for the project owner

1. **Existing files in the document library** — migrate them, or accept that pre-Phase-1 uploads are gone?
2. **Profile photo URL convention** — store full Blob URLs (preferred) or keep an indirection route?
3. **Communication plan for DNS cutover** — when, and to whom?
4. **Replit project decommissioning** — keep around as a read-only fallback for a month, or shut down on cutover day?
5. **Default super-admin password** — `SuperAdmin123!` is in `DEPLOYMENT_GUIDE.md` and was potentially the original seed value. Has it been rotated for the production accounts? (`mentor@sonsiel.org`, `xyrn@outlook.com`)
6. **NurseHack4Health** — soft-deleted. Should it be hard-deleted (drop the row + the 2 admin memberships), or stay as inactive in case of revival?

---

## Status legend

- [x] Done
- [ ] Pending

For deployment/operational state see [CHANGELOG.md](./CHANGELOG.md). For audit findings see [AUDIT.md](./AUDIT.md). For the user-facing feature catalog see [FEATURES.md](./FEATURES.md).
