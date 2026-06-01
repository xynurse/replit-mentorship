# SONSIEL Mentorship Platform — Features & User Guide

This document describes what the platform does and how to use it. It covers a feature-by-feature overview, an end-user guide (for mentors and mentees), and an admin/super-admin guide.

> **Current version: 1.4.0 — 2026-06-01.** All planned migration phases (Vercel deployment, Ably real-time, Vercel Blob, theme rework, application pipeline, CoC gate, cohort assignment) are complete. See [CHANGELOG.md](./CHANGELOG.md) for release history.

---

## 1. Roles

| Role          | Who                                            | What they can do                                                                                  |
| ------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `SUPER_ADMIN` | SONSIEL leadership                             | Full access. Manage other admins, programs, cohorts, audit logs, all user data.                   |
| `ADMIN`       | Program coordinators                           | Manage cohorts, applications, matches, surveys, documents, reminders. No super-admin operations.  |
| `MENTOR`      | Healthcare professionals mentoring others      | Manage their profile, mentees, meetings, goals, journal, documents shared with them.              |
| `MENTEE`      | Early-career or transitioning nurses           | Manage their profile, mentor relationship, goals, meetings, journal, community participation.     |

Roles are assigned at registration (mentor or mentee) or by an admin (admins are seeded or promoted manually).

---

## 2. Feature catalog

### Authentication & accounts

- Email + password registration with `MENTOR` or `MENTEE` role at signup.
- Login with rate limiting (10 attempts per 15 min) and lockout after 5 failed attempts (15 min lockout).
- Password reset via email (Resend).
- Forced password change on first login when an admin sets a temporary password.
- Account deactivation toggle (admin only).
- Multi-program selector — users enrolled in more than one program pick their active context after login.

### Application intake

- **`/apply` public form** — 5-step intake wizard for Mentor and Mentee applicants. Covers personal info, professional background, SONSIEL membership, role-specific questions (11-area interest/comfort ratings, preferred methods, hours, motivations, past experience), and a review step. No login required.
- Submissions create a `program_applications` row with `status: PENDING`. Duplicate email guard.

### Onboarding gate

- **Code of Conduct signing** (`/onboarding/coc`) — newly-activated users must read and sign the full SONSIEL CoC before accessing any part of the platform. Scroll-to-bottom detection gates the form; canvas-based signature pad captures a PNG. Signing is idempotent; admins are exempt.
- **Profile setup** — after CoC, new users are prompted to complete their profile before proceeding.
- All gate checks run in `ProtectedRoute` — the sequence is: auth → mustChangePassword → CoC → program selection → content.

### Profile & settings

- Two-stage onboarding: register → complete profile.
- Full intake survey fields rendered and editable on My Profile: interest/comfort ratings, motivations, preferred methods, availability, career context.
- Profile photo upload (Vercel Blob, 5 MB max, JPEG/PNG/GIF/WebP).
- Timezone, language, notification preferences.

### Mentorship matches

- Application questions (admin-defined per cohort).
- Application responses captured and reviewable.
- Auto-matching via configurable criteria.
- Manual match creation/editing by admins.
- Match status: pending, active, completed, declined.
- Mentor and mentee both view the match's shared workspace.

### Meetings & calendar

- Create, edit, and delete meeting logs against a match.
- Calendar views: month grid + agenda list toggle.
- Availability / unavailability blocking — multi-day blackout periods with visual indicator.
- Subscribed ICS feed — per-user `webcal://` URL for Google / Apple / Outlook sync.
- Meeting log fields: format (virtual / in-person / phone / async), location, duration, agenda, notes.
- Per-event participants and RSVP state.

### Goals & tasks

- SMART goals attached to a match or to a user.
- Milestones underneath each goal.
- Tasks underneath milestones — assignees, due dates, status (pending / in progress / done), approval flow.
- Task comments and activity log.
- Goal progress entries (text + percentage).
- At-risk goal surfacing on the goals list.

### Mentorship journal

- Per-mentee journal entries.
- Mentors can review their mentees' journals.
- Entries support rich text and tags.

### Document library

- Personal, shared, and system folders.
- My Documents (collapsible) at top, System Resources below, Shared With Me in the right rail.
- Document versioning.
- Granular access: VIEW, DOWNLOAD, EDIT.
- Public, cohort-scoped, track-scoped, match-scoped, or private visibility.
- File upload and download via Vercel Blob (50 MB max for documents).
- Quick-action links: "View My Documents" and "View Platform Documents" on the dashboard.

### Community boards

- Two boards: general community (mentor + admin) and mentee community.
- Thread categories.
- Threads with replies, pin/unpin, react.
- Per-board access rules (e.g., mentees can't post in the mentor board).

### Notifications & real-time

- In-app notifications (DB-backed) for: new message, task assigned, document shared, match created, admin ping, etc.
- Notification preferences (per type opt-in/out).
- Email notifications via Resend for: welcome, password reset, new message (configurable), admin ping.
- Live notification bell badge updates via Ably WebSocket — updates without page reload.
- Typing indicators and online presence in messaging.

### Direct messaging

- 1:1 and group conversations.
- Message attachments (images, documents).
- Read receipts.
- Reactions (emoji).
- Message editing and deletion.
- Real-time delivery via Ably — messages appear instantly without refresh.

### Reminders

- Personal reminders with optional recurrence.
- Mark complete, dismiss, snooze.

### Surveys

- Admin-defined survey templates (mid-program, end-program, match-feedback, custom).
- Survey responses tied to user + match + cohort context.
- Status: draft / active / archived / closed.
- Anonymous responses option.

### Certificates

- Issued by admins for program completion.
- Certificate verification via public endpoint.
- Client-side PDF export.

### Admin dashboard

- Platform stats: total users, active users, mentors/mentees split, matches by status — all clickable, routing to the relevant detail page or tab.
- Recent activity widget, progress widget, goals brief widget, mentor/mentee assignment card.

### Admin tooling

- **Users** — search, role/status/dormancy/CoC filters, bulk welcome email, bulk password reset, deactivate, ping (in-app + email).
- **CoC compliance column** — every user row shows Signed / Pending / N/A; "CoC Pending" filter surfaces unsigned members; detail dialog shows exact signature timestamp.
- **Cohorts** — create, archive, set application questions.
- **Applications** — full pipeline view: review responses, advance status (PENDING → REVIEWING → APPROVED → activate), activate account (one-click provision + set-password email), assign to cohort.
- **Cohort assignment** — after activation, pick a cohort from the applications queue; creates a `cohort_memberships` row and stamps the application record. Reassignment supported.
- **Matching** — auto-match by tags or manually assign mentor↔mentee.
- **Connections** — unmatched toggle, inline unmatched counts per cohort.
- **Analytics** — clickable KPI cards routing to relevant admin pages; productivity metrics (goals, conversations, documents, journals, meetings).
- **Meetings** — upcoming meetings dashboard with date/time context.
- **Documents** — manage system folders and public documents.
- **Surveys** — build templates, monitor response rates.
- **Reminders** — program-wide reminders.
- **Certificates** — award certificates from admin panel.
- **Audit Log** — filter by actor, action, resource type, date range. Export CSV.
- **Error Logs** — server exceptions captured during runtime.
- **Platform Status** — system health and recent platform issues.
- **Submissions** — user-submitted content awaiting review.

### Audit & compliance

- Every privileged action is logged: login (success/fail), account locks, password resets, role changes, match creation, document uploads, CoC signing, etc.
- Audit log captures actor, action, resource type/ID, IP, user agent, success flag, error message, and metadata.
- Searchable history per user.

### Programs

- Currently one active program: **SONSIEL Mentorship Program**.
- Multi-program tenancy supported; users can be enrolled in multiple programs with a default selected via the program switcher.
- NurseHack4Health: soft-deleted (reactivated and re-deactivated as needed).

### Multi-language support

- English, Spanish, Portuguese in the client.
- Server messages are English-only.

---

## 3. End-user guide

### For all users

#### Logging in

1. Visit the platform URL.
2. Enter the email + password you registered with or received in your activation email.
3. If you've never logged in before and an admin created your account, use the set-password link from your activation email.
4. After 5 failed attempts your account locks for 15 minutes.
5. If you're enrolled in more than one program, you'll see a program selector before reaching your dashboard.

#### Forgot your password

1. Click **Forgot password?** on the login screen.
2. Enter your email. You'll always see a generic confirmation message.
3. If your email is registered, you'll receive a reset link valid for 1 hour.

#### Code of Conduct

Newly-activated accounts must sign the SONSIEL Code of Conduct before accessing the platform. You'll be routed there automatically on first login. Read through the full document, draw your signature in the pad, confirm your name and email, and submit. You only need to do this once.

#### Completing your profile

After signing the CoC, you'll be prompted to complete your profile (fields differ by role). All fields are editable later from **My Profile**.

#### Switching programs

If you're enrolled in more than one program, use the program switcher in the top nav.

### For mentees

- **Apply**: submit your application at `/apply`. The matching team will review and create a match. You'll get an email when matched.
- **Once matched**: visit **My Connections** to see your mentor. The match dashboard has shared goals, meetings, journal, and documents.
- **Track goals**: create SMART goals and break them into milestones and tasks. Update progress regularly.
- **Journal**: write reflective entries in **Journal**. Your mentor can read them.
- **Community**: post in the **Mentee Community** board.
- **Direct message** your mentor or peers via the message icon.

### For mentors

- **My mentees** lists your active matches.
- **Review mentee journals** under each match.
- **Approve tasks** when your mentee marks them done.
- **Schedule meetings** in the calendar.
- **Share documents** scoped to specific matches, cohorts, or tracks.
- **Community**: participate in the general **Community** board.

---

## 4. Admin guide

### Application pipeline

1. **Applications** (`/admin/applications`) — new submissions arrive with status `PENDING`.
2. Advance to `REVIEWING`, then `APPROVED` (or `WAITLISTED` / `REJECTED`).
3. For `APPROVED` rows without an account: **Activate Account** — provisions the user, pre-populates their profiles from application data, sends a set-password email.
4. After activation: **Assign to Cohort** — opens a cohort picker; creates a `cohort_memberships` row. Cohort name appears in the applications list and detail panel.

### CoC compliance

- The **Users** page (`/admin/users`) has a **CoC** column: green "Signed", amber "Pending", or "N/A" for admins.
- Use the **CoC** filter dropdown to isolate unsigned members.
- Click **View Details** on any user to see whether they've signed and the exact timestamp.
- Newly-activated users will be unsigned until they complete the gate on first login. No manual action needed.

### Daily operations

- **Dashboard** (`/admin`) — headline metrics, recent activity.
- **Users** (`/admin/users`) — search, filter (role / status / dormancy / CoC), bulk operations.
- **Cohorts** (`/admin/cohorts`) — create cohorts, assign tracks, define application questions.
- **Applications** (`/admin/applications`) — full intake pipeline (see above).
- **Matching** (`/admin/matching`) — auto-match or manually assign.
- **Connections** (`/admin/connections`) — unmatched toggle, per-cohort counts.
- **Documents** (`/admin/documents`) — manage system folders and platform documents.
- **Meetings** (`/admin/meetings`) — upcoming meetings across all matches.
- **Analytics** (`/admin/analytics`) — clickable KPI overview, productivity metrics.

### Less-frequent operations

- **Audit Log** (`/admin/audit-logs`) — filter by actor, action, resource type, date range.
- **Error Logs** (`/admin/error-logs`) — first place to look for server-side issues.
- **Platform Status** (`/admin/platform-status`) — system health.
- **Settings** (`/admin/settings`) — branding, default email signatures.
- **Certificates** (`/admin/certificates`) — award or revoke certificates.
- **Surveys** (`/admin/surveys`) — build templates, view response rates.
- **Reminders** (`/admin/reminders`) — program-wide reminders.
- **Submissions** (`/admin/submissions`) — flagged community content.

### Adding a new admin

1. Sign in as `SUPER_ADMIN`.
2. **Users → Create User** with role `ADMIN`. Set a temporary password.
3. The new admin receives a welcome email and must change their password on first login.
4. Admins are exempt from the CoC signing gate.

### Bulk user import

1. **Users → Bulk Import**.
2. Upload a CSV with columns: `email, firstName, lastName, role`.
3. Each row creates an account with a generated temporary password and queues a welcome email.
4. Failed rows are reported in the response; successful rows appear in the audit log.

### Resetting a stuck account

If a user is locked out:

1. Search for them in **Users**.
2. Open their detail page.
3. **Unlock account** (sets `lockedUntil = null` and `failedLoginAttempts = 0`).
4. Optionally send a password reset email or ping them.

### Decommissioning a program

Set `programs.is_active = false` via the admin UI or SQL. The user-facing program switcher hides inactive programs via `getUserPrograms()`. This was done for NurseHack4Health on 2026-05-03.

### Recovering from an outage

1. Check Vercel deployment logs.
2. If the function is failing on import, check for any recent static import that pulls in a heavy dev-only dep.
3. If the database is unreachable, check the Neon console — free-tier auto-suspend is the most common cause.
4. Roll back to the previous deployment from the Vercel dashboard.

---

## 5. Environment variables

| Variable               | Required | Used by                                        | Notes                                                                          |
| ---------------------- | -------- | ---------------------------------------------- | ------------------------------------------------------------------------------ |
| `DATABASE_URL`         | yes      | `server/db.ts`, all storage queries            | Use the **pooled** Neon URL for app traffic; direct URL for migrations.        |
| `SESSION_SECRET`       | yes      | `server/auth.ts`                               | 32+ random hex chars. Rotating it logs everyone out.                           |
| `RESEND_API_KEY`       | yes      | `server/email.ts`                              | Without this, password reset and activation emails will return 500.            |
| `RESEND_FROM_EMAIL`    | optional | `server/email.ts`                              | Defaults to `SONSIEL Mentorship Hub <noreply@sonsiel.org>`.                    |
| `APP_URL`              | optional | `server/email.ts` (`getTrustedBaseUrl`)        | Set after DNS cutover; falls back to `VERCEL_URL` until then.                  |
| `ABLY_API_KEY`         | yes      | `server/realtime/ably.ts`                      | Required for live messaging, typing indicators, notification badge updates.     |
| `BLOB_READ_WRITE_TOKEN`| yes      | `server/storage/blob.ts`                       | Required for document and profile photo upload/download.                        |

See [.env.example](./.env.example) for the canonical list.

---

## 6. Where to look for trouble

| Symptom                                                | First place to look                                                                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Login returns 401 "Invalid email or password"          | Wrong creds or `lockedUntil` active. Check `users.failed_login_attempts` and `users.locked_until`.                            |
| Password reset email never arrives                     | `/api/admin/email-diagnostics` → confirm `RESEND_API_KEY`. Check Resend dashboard for bounces.                                 |
| User stuck on CoC signing page after signing           | Check if `users.has_signed_coc` was set to `true` and the query cache was invalidated. Look for 500 on `POST /api/onboarding/coc`. |
| New user skipped CoC and got into the platform         | Verify they're not ADMIN/SUPER_ADMIN (exempt). Check `ProtectedRoute` gate order in `client/src/lib/protected-route.tsx`.     |
| Document upload or download fails                      | Confirm `BLOB_READ_WRITE_TOKEN` is set in Vercel env. Check the Vercel Blob store status.                                     |
| Profile photos broken                                  | Same as above — Vercel Blob dependency.                                                                                        |
| Notification bell never updates without refresh        | Confirm `ABLY_API_KEY` is set in Vercel env and the Ably app is active.                                                        |
| Messages don't appear in real time                     | Same — Ably dependency.                                                                                                        |
| `FUNCTION_INVOCATION_FAILED` on every request          | Almost always a top-level import that throws on Vercel but not in dev. Check recent dependency changes.                        |
| Build fails on Vercel but passes locally               | Check for new dependencies that pull in rollup or sharp (platform-specific native binaries Vercel may skip).                   |
| Cohort assignment shows no cohorts in picker           | All cohorts may be ARCHIVED or COMPLETED. Create or reactivate a cohort in `/admin/cohorts`.                                   |

---

## 7. Glossary

- **Match** — an active mentoring relationship between exactly one mentor and one mentee.
- **Cohort** — a time-bounded group of members in a program. Each cohort has its own application questions and matching window.
- **Track** — a thematic specialization within a cohort (e.g., critical care, leadership, informatics).
- **Program** — the top-level container. Currently: SONSIEL Mentorship Program.
- **CoC** — Code of Conduct. Newly-activated members must sign before accessing the platform.
- **Activation** — the act of provisioning a user account from an approved application, sending a set-password email, and optionally assigning to a cohort.
