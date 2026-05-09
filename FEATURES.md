# SONSIEL Mentorship Platform — Features & User Guide

This document describes what the platform does and how to use it. It's split into a feature-by-feature overview, an end-user guide (for mentors and mentees), and an admin/super-admin guide.

> **Phase 1 status note.** The platform is currently deployed on Vercel with two known-disabled subsystems pending Phases 2 and 3. Where a feature is partially or fully impacted, you'll see a ⚠️ or ❌ marker. See [TODO.md](./TODO.md) for the remediation plan and [AUDIT.md](./AUDIT.md) for the deployment audit.

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
- Email verification flow (currently auto-verified at registration; the verification token endpoint exists but is not gated on).

### Profile & onboarding

- Two-stage onboarding: register → complete profile.
- Mentor profile fields: organization, fields of expertise, mentorship roles, professional background, availability.
- Mentee profile fields: career goals, education, fields of interest, availability.
- ⚠️ **Profile photo**: data layer works, **display will fail** until Phase 3 (Vercel Blob).

### Mentorship matches

- Application questions (admin-defined per cohort).
- Application responses captured and reviewable.
- Auto-matching via configurable criteria.
- Manual match creation/editing by admins.
- Match status: pending, active, completed, declined.
- Mentor and mentee can both view the match's shared workspace.

### Meetings / calendar

- Create, edit, and delete meeting logs against a match.
- Calendar events with participants.
- Meeting log fields: format (virtual / in-person / phone / async), location, duration, agenda, notes.
- Per-event participants and RSVP state.

### Goals & tasks

- SMART goals attached to a match or to a user.
- Milestones underneath each goal.
- Tasks underneath milestones; tasks have assignees, due dates, status (pending / in progress / done), and approval flow.
- Task comments and activity log.
- Goal progress entries (text + percentage).

### Mentorship journal

- Per-mentee journal entries.
- Mentors can review their mentees' journals.
- Entries support rich text and tags.

### Document library

- ⚠️ **Currently broken in production.** Pending Phase 3.
- Personal, shared, and system folders.
- Document versioning.
- Granular access: VIEW, DOWNLOAD, EDIT.
- Public, cohort-scoped, track-scoped, match-scoped, or private visibility.
- Bulk import via Uppy + presigned URL flow.

### Community boards

- Two boards: general community (mentor + admin) and mentee community.
- Thread categories.
- Threads with replies, pin/unpin, react.
- Per-board access rules (e.g., mentees can't post in the mentor board).

### Notifications & email

- In-app notifications (DB-backed) for: new message, task assigned, document shared, match created, etc.
- Notification preferences (per type opt-in/out).
- Email notifications via Resend for: welcome (admin-created accounts), password reset, new message (configurable).
- ⚠️ **Live notification bell badge updates** require Phase 2 (Ably). Currently badge updates on page navigation/refresh only.

### Direct messaging

- 1:1 and group conversations.
- Message attachments (images, documents).
- Read receipts.
- Reactions (emoji).
- Message editing and deletion.
- ⚠️ REST send/receive works. **Real-time delivery, typing indicators, online presence are silent** until Phase 2.
- ⚠️ Message attachments will fail until Phase 3.

### Reminders

- Personal reminders with optional recurrence.
- Mark complete, dismiss, snooze.
- Email digest of upcoming reminders (planned; admin only currently).

### Surveys

- Admin-defined survey templates (mid-program, end-program, match-feedback, custom).
- Survey responses tied to user + match + cohort context.
- Status: draft / active / archived / closed.
- Anonymous responses option.

### Certificates

- Issued by admins for program completion.
- Certificate verification via public endpoint.
- ❌ **PDF generation** route exists in client (`pdf-export`) but PDF rendering happens client-side; export is fine. Distribution by email is not yet wired.

### Admin dashboard

- Platform stats: total users, active users, mentors/mentees split, matches by status.
- User management: search, role filter, active/inactive filter, bulk welcome email, bulk password reset, deactivate.
- Cohort management: create, archive, set application questions.
- Application review.
- Audit log viewer with filters (actor, resource type, time range).
- Error log viewer.
- Data export requests (CSV) for users, matches, meetings, etc.
- Account deletion requests (GDPR-style).
- Email diagnostics: confirms `RESEND_API_KEY` is configured.

### Audit & compliance

- Every privileged action is logged: login (success/fail), account locks, password resets, role changes, match creation, document uploads, etc.
- Audit log captures actor, action, resource type/ID, IP, user agent, success flag, error message, and free-form metadata.
- Error log for server-side exceptions.
- Searchable history per user.

### Programs

- Currently one active program: **SONSIEL Mentorship Program**.
- Program model supports multi-program tenancy. NurseHack4Health was soft-deleted on 2026-05-03.
- Each user can be enrolled in multiple programs with a default selected via the program switcher.

### Multi-language support

- English, Spanish, Portuguese in the client.
- Server messages are English-only.

---

## 3. End-user guide

### For all users

#### Logging in

1. Visit `https://replit-mentorship.vercel.app/login` (until DNS cuts to `mentorship.sonsiel.org`).
2. Enter the email + password you registered with.
3. If you've never logged in before and an admin created your account, use the temporary password from the welcome email — you'll be forced to change it immediately.
4. After 5 failed attempts your account locks for 15 minutes.

#### Forgot your password

1. Click **Forgot password?** on the login screen.
2. Enter your email. You'll always see a generic confirmation message (we never reveal whether an email is registered).
3. If your email is registered, you'll receive a reset link valid for 1 hour.

#### Completing your profile

After your first login you'll be redirected to **Complete Profile**. The fields differ by role; all are editable later from **My Profile**.

#### Switching programs

If you're enrolled in more than one program, use the program switcher in the top nav. Currently only the SONSIEL Mentorship Program is active for end users.

### For mentees

- **Find a mentor**: visit **Apply** and submit answers to your cohort's application questions. The matching team will review and create a match. You'll get an email when matched.
- **Once matched**: visit **My Connections** to see your mentor. The match dashboard has shared goals, meetings, journal, and documents.
- **Track goals**: under your match, create SMART goals and break them into milestones and tasks. Update progress regularly.
- **Journal**: write reflective entries in **Journal**. Your mentor can read them.
- **Community**: post in the **Mentee Community** board; ask questions, share resources, react to others.
- **Direct message** your mentor or peers via the message icon.

### For mentors

- **My mentees** lists your active matches.
- **Review mentee journals** under each match.
- **Approve tasks** when your mentee marks them done (if approval is required for the task type).
- **Schedule meetings** in the calendar. Add format (virtual / in-person / phone / async), agenda, and post-meeting notes.
- **Share documents** scoped to specific matches, cohorts, or tracks via **Documents → Share**.
- **Community**: participate in the general **Community** board with other mentors and admins.

---

## 4. Admin guide

### Daily operations

- **Dashboard** (`/admin`) is the landing page. Headline metrics are: active users, matches, applications pending review, recent audit events.
- **Users** (`/admin/users`): search, filter by role/active state, bulk-welcome-email, bulk-reset-password.
- **Cohorts** (`/admin/cohorts`): create cohorts and assign tracks; define application questions; open/close enrollment.
- **Applications** (`/admin/applications`): review responses, reach out to candidates, advance to matching.
- **Matching** (`/admin/matching`): auto-match by tags or manually assign mentor↔mentee.
- **Documents** (`/admin/documents`, also `/documents`): manage system folders and public documents. ⚠️ Disabled until Phase 3.
- **Surveys** (`/admin/surveys`): build templates, monitor response rates.
- **Reminders** (`/admin/reminders`): create program-wide reminders.

### Less-frequent operations

- **Audit Log** (`/admin/audit-log`): filter by actor, action, resource type, date range. Export CSV.
- **Error Logs** (`/admin/error-logs`): server exceptions captured during runtime. First place to look when something is misbehaving.
- **Platform Status** (`/admin/platform-status`): system health and recent platform issues.
- **Settings** (`/admin/settings`): branding, default email signatures, rate-limit thresholds.
- **Submissions** (`/admin/submissions`): user-submitted content awaiting review (e.g., flagged community threads).
- **Email Diagnostics** (`GET /api/admin/email-diagnostics`): check if `RESEND_API_KEY` is configured; returns the from-email currently in use.

### Adding a new admin

1. Sign in as a `SUPER_ADMIN`.
2. **Users → Add user** with role `ADMIN`. Set a temporary password.
3. The new admin receives a welcome email and is forced to change their password on first login.

### Bulk user import

1. **Users → Bulk Import**.
2. Upload a CSV with columns: `email, firstName, lastName, role`.
3. Each row creates an account with a generated temporary password and queues a welcome email.
4. Failed rows are reported in the response; successful rows show up in the audit log with action `USER_CREATED`.

### Resetting a stuck account

If a user is locked out:

1. **Users**, search for them.
2. Open their detail page.
3. Click **Unlock account** (sets `lockedUntil = null` and `failedLoginAttempts = 0`).
4. Optionally **Send password reset email**.

If they've forgotten their password and the reset email isn't arriving, run the email diagnostic (`/api/admin/email-diagnostics`) and confirm `RESEND_API_KEY` is set in Vercel env. The most common cause is an expired or revoked API key.

### Decommissioning a program

To take a program out of circulation without losing history:

1. SQL or admin UI: set `programs.is_active = false`.
2. Remove the program object from `server/auto-seed.ts` so a future re-seed doesn't recreate it.
3. The user-facing program switcher will hide it via `getUserPrograms()`.

This is exactly what was done for NurseHack4Health on 2026-05-03.

### Recovering from an outage

If the deployment is failing:

1. Check Vercel: `vercel ls` and `vercel inspect <url> --logs`.
2. If the function is failing on import, check whether someone recently added a static import that pulls in a heavy dev-only dep. The Phase 1 deploy was blocked for hours on exactly this — see [CHANGELOG.md](./CHANGELOG.md) entry under "Fixed".
3. If the database is unreachable, check Neon's console — the auto-suspend for free-tier endpoints is the most common cause.
4. Roll back: `vercel rollback <previous-deployment-url> --prod`.

---

## 5. Environment variables

| Variable               | Required | Used by                                        | Notes                                                                          |
| ---------------------- | -------- | ---------------------------------------------- | ------------------------------------------------------------------------------ |
| `DATABASE_URL`         | yes      | `server/db.ts`, all storage queries            | Use the **pooled** Neon URL for app traffic; direct URL for migrations.        |
| `SESSION_SECRET`       | yes      | `server/auth.ts`                               | 32+ random hex chars. Rotating it logs everyone out.                           |
| `RESEND_API_KEY`       | yes      | `server/email.ts`                              | Without this, password reset and notification emails will return 500.          |
| `RESEND_FROM_EMAIL`    | optional | `server/email.ts`                              | Defaults to `SONSIEL Mentorship Hub <noreply@sonsiel.org>`.                    |
| `APP_URL`              | optional | `server/email.ts` (`getTrustedBaseUrl`)        | Set after DNS cutover; falls back to `VERCEL_URL` until then.                  |
| `ABLY_API_KEY`         | future   | Phase 2 real-time stack                        | Not yet wired in. See [TODO.md](./TODO.md).                                    |
| `BLOB_READ_WRITE_TOKEN`| future   | Phase 3 file storage                           | Not yet wired in. See [TODO.md](./TODO.md).                                    |

See [.env.example](./.env.example) for the canonical list.

---

## 6. Where to look for trouble

| Symptom                                                | First place to look                                                                                                            |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Login returns 401 with "Invalid email or password"     | The user has wrong creds or is in `lockedUntil` window. Check `users.failed_login_attempts` and `users.locked_until`.          |
| Password reset email never arrives                     | `/api/admin/email-diagnostics` → confirm `RESEND_API_KEY`. Also check Resend dashboard for bounces.                            |
| Document library page shows but uploads/downloads fail | Phase 3 isn't done. Object storage is stubbed. See [TODO.md](./TODO.md).                                                       |
| Profile photos look broken                             | Same as above — Phase 3 dependency.                                                                                            |
| Notification bell never updates without refresh        | Phase 2 isn't done. Real-time channel stubbed.                                                                                 |
| Browser console floods with `socket.io` errors         | Same as above. Client retries forever. Cosmetic for now.                                                                       |
| Function returns `FUNCTION_INVOCATION_FAILED`          | Almost always a top-level import that throws on Vercel but not in dev. See the Phase 1 deploy story in [CHANGELOG.md](./CHANGELOG.md). |
| Build fails on Vercel but passes locally               | Vercel's `npm install` skips optional native deps occasionally. Check for any new dependency that pulls in rollup or sharp.    |

---

## 7. Glossary

- **Match**: an active mentoring relationship between exactly one mentor and one mentee.
- **Cohort**: a time-bounded group of mentees in a program. Each cohort has its own application questions and matching window.
- **Track**: a thematic specialization within a cohort (e.g., critical care, leadership, informatics).
- **Program**: the top-level container. Currently SONSIEL Mentorship Program.
- **Phase 2 / Phase 3**: planned migrations to replace Replit-specific subsystems. See [TODO.md](./TODO.md).
