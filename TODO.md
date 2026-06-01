# TODO — SONSIEL Mentorship Platform Roadmap

What's left to ship and then evolve the platform. Migration (Phases 1–3) is done; the rest is the product roadmap.

Items are grouped by phase. Within a phase they're ordered by what should happen first.

---

## Phase 4 — Quick wins ✅ Complete

- [x] **Quick actions: split "View Documents"** into "View My Documents" + "View Platform Documents" on the dashboard.
- [x] **Analytics chart colors** — fixed mentee-gray contrast on user-distribution chart.
- [x] **Investigate missing mentor profiles in admin Connections** — resolved.
- [x] **Reactivate NurseHack4Health program** — `is_active = true`.
- [ ] **Change favicon** — deferred; needs source asset (logo/image file) from project owner.

---

## Phase 5 — Dashboard insights ✅ Complete

- [x] **Recent activity widget**
- [x] **Progress widget**
- [x] **Goals brief widget**
- [x] **Mentor/mentee assignment card**
- [x] **Hyperlink all stat boxes**
- [x] **Multi-program selector on login**

---

## Phase 6 — Profile, calendar, goals, docs ✅ Complete

- [x] **My Profile: render full onboarding survey**
- [x] **Calendar: agenda view toggle**
- [x] **Calendar: availability marking**
- [x] **Calendar: subscribed ICS feed**
- [x] **Goals page** — at-risk surfacing, split empty states
- [x] **Documents page restructure** — My / System / Shared With Me layout

---

## Phase 7 — Admin tooling ✅ Complete

- [x] **Award certificates UI**
- [x] **Upcoming meetings dashboard**
- [x] **User list: click-through profile + Last Active column**
- [x] **Dormant filters (14/30/60/90 days)**
- [x] **Ping user** (in-app + email)
- [x] **Connections: unmatched toggle**
- [x] **Productivity metrics overhaul**
- [x] **Analytics: clickable performance summary boxes**

---

## Phase 8 — Application intake + onboarding workflow ✅ Complete

- [x] **External-facing application form** at `/apply` — 5-step wizard, full Fillout survey mapped, JSONB storage.
- [x] **Application pipeline** — PENDING → REVIEWING → APPROVED/WAITLISTED/REJECTED status transitions in admin UI.
- [x] **Admit/activate flow** — "Activate Account" button provisions user, pre-populates mentor/mentee profiles from application data, sends set-password email.
- [x] **Onboarding sign-off** — Code of Conduct acceptance gate with canvas signature. Existing users backfilled.
- [x] **Cohort assignment** — after activation, admin assigns users to a cohort from the applications queue.

---

## Phase 9 — Theme rework ✅ Complete

- [x] **Notion-style CSS token pass** — warm palette, neutral dark mode, hairline borders, real shadows, Inter typography.

---

## Phase 10 — Surveys

- [ ] **Survey builder** — native survey creation UI, writes to existing `surveys` schema. *(Next after onboarding)*

---

## Phase 10 (revised) — Meeting logging

**Decision (2026-05-28):** External calendar integration (Google Meet / Zoom OAuth) is descoped. It's a significant lift and unlikely to be fully utilized given the program structure. Members will **log meetings manually** within the platform using the existing meetings UI and `meeting_logs` table. No calendar auth, webhook infrastructure, or "invite the platform" mechanism needed.

- [x] **Meeting integration** — ~~Google Meet / Zoom~~ → manual in-platform logging. Already built; no further work needed.

---

## Carried over from migration

See sections below — DNS cutover, token rotation, deploy/operational follow-ups still apply.

---

## P0 — Phase 3 wrap-up: deploy ✅ Complete

- [x] Provision Vercel Blob on the `replit-mentorship` project.
- [x] `BLOB_READ_WRITE_TOKEN` confirmed set on Vercel Production + Preview.
- [x] `ABLY_API_KEY` set on Vercel.
- [x] Pushed to `main`; Vercel auto-deploying.
- [ ] **DNS cutover** — point `mentorship.sonsiel.org` CNAME → `cname.vercel-dns.com`. *(Deferred — to be done later)*
- [ ] **Re-upload 10 program guides** via admin UI after DNS cutover. *(Deferred)*

---

## P0 — Phase 2 wrap-up: Ably ✅ Complete

- [x] `ably` v2 installed; socket.io removed.
- [x] `server/realtime/ably.ts` live.
- [x] `ABLY_API_KEY` provisioned and set on Vercel.
- [ ] Create an app for the mentorship platform; capture the API key.
- [ ] Set `ABLY_API_KEY` in Vercel Production + Preview env. Also pull locally via `vercel env pull`.
- [ ] Push Phase 2 to `main`; Vercel auto-deploys.

### Verification

- [ ] Two browsers logged in as different users in the same conversation: typing in one shows the typing indicator in the other within 1s.
- [ ] Sending a message in one shows up in the other without a page refresh.
- [ ] Triggering an admin action that creates a notification (e.g., assign a task) updates the recipient's notification bell badge live.
- [ ] Open browser devtools network tab and confirm Ably's WebSocket connection comes up (URL contains `realtime.ably.io`).

---

## P1 — DNS cutover

**Deferred — to be done when ready.**

- [x] Add `mentorship.sonsiel.org` as a domain on the Vercel project.
- [ ] At Google Cloud DNS, add CNAME: `mentorship` → `cname.vercel-dns.com.` (TTL 3600)
- [ ] Set `APP_URL=https://mentorship.sonsiel.org` in Vercel production env.
- [ ] Notify users of cutover timing.
- [ ] Re-upload 10 program guides via admin UI after cutover.

---

## P2 — Cleanup after Phase 2

Done as part of Phase 3 (1.1.0):

- [x] Delete `server/replit_integrations/`.
- [x] Drop `@google-cloud/storage`, `google-auth-library`, `@uppy/*`.

Done as part of Phase 2 (1.2.0):

- [x] Delete `server/websocket.ts` (replaced by `server/realtime/ably.ts`).
- [x] Drop `socket.io`, `socket.io-client`, `@types/socket.io-client`, `bufferutil`.

General hygiene (any time):

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
