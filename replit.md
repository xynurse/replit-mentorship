# SONSIEL Mentorship Hub

## Overview

SONSIEL Mentorship Hub is a comprehensive mentorship management platform for healthcare professionals. It connects mentors and mentees to facilitate professional development and career growth. Key capabilities include role-based access control (Super Admin, Admin, Mentor, Mentee), multi-language support (English, Spanish, Portuguese), and a full authentication system with email verification and password reset. The platform aims to streamline mentorship processes within the healthcare sector.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript and Vite.
- **Routing**: Wouter for lightweight client-side routing.
- **State Management**: TanStack React Query for server state.
- **UI/UX**: shadcn/ui built on Radix UI, styled with Tailwind CSS following Material Design 3 principles, including light/dark mode.
- **Forms**: React Hook Form with Zod validation.

### Backend
- **Runtime**: Node.js with Express.js and TypeScript.
- **Authentication**: Passport.js with local strategy, session-based using express-session and PostgreSQL for session storage. Scrypt hashing for password security.
- **API**: RESTful endpoints.
- **Real-time**: Socket.io WebSocket server for messaging with REST fallback.

### Core Features

- **Messaging System**: Real-time communication via Socket.io supporting various conversation types (DIRECT, MATCH, TRACK_COMMUNITY, COHORT_ANNOUNCEMENT) and message types (TEXT, FILE, SYSTEM, ANNOUNCEMENT) with reactions, replies, editing, and deletion. Includes typing indicators, presence, and read receipts.
- **Document Management System**: Utilizes Replit Object Storage for cloud-based file persistence. Features automatic folder types (SYSTEM, PERSONAL, SHARED), hierarchical organization, version control, granular access control, and secure file sharing with Uppy integration for uploads.
- **Notification System**: 21 event types with priority levels and customizable email preferences (INSTANT, DAILY_DIGEST, WEEKLY_DIGEST, NEVER). Real-time delivery via Socket.io and an inbox for management. Admins can broadcast announcements.
- **Mentor-Mentee Connections System**: Manages mentor-mentee pairings, supports multi-mentee assignments for mentors, and allows mentors to view mentee goals. Features a status workflow (PROPOSED → ACTIVE → PAUSED/COMPLETED/TERMINATED) and automatic cohort creation for ad-hoc matches.
- **Mentorship Journal System**: Allows mentees to track growth, learnings, and reflections with mood tracking and customizable visibility (PRIVATE, MENTOR_ONLY, PUBLIC). Mentors can provide feedback on mentee entries.
- **PDF Export System**: Client-side PDF generation using jsPDF and html2canvas for exporting goals, user profiles, and comprehensive mentorship impact reports with SONSIEL branding.
- **Reminders System**: Supports personal, mentor-assigned, and admin-assigned reminders with status workflows, priority levels, and recurrence options (NONE, DAILY, WEEKLY, MONTHLY).
- **Profile Management System**: Comprehensive user profile editing for both users (/my-profile) and admins (/admin/users/:id/profile). Features tabbed interface with Core Info (personal/professional details), Role Selection (seeking_mentor/providing_mentorship/both), Mentee-specific fields (goals, preferred methods, duration), and Mentor-specific fields (experience, availability, skills). Supports SONSIEL membership status, fields of expertise, education level, certifications, and program expectations.

### Data Storage
- **Database**: PostgreSQL.
- **ORM**: Drizzle ORM with drizzle-zod for schema validation.
- **Schema**: Defined in `shared/schema.ts`.
- **Migrations**: Managed via drizzle-kit.

### Authentication & Authorization
- **Role-Based Access Control**: Four roles (SUPER_ADMIN, ADMIN, MENTOR, MENTEE) with middleware guards.
- **Security**: Account lockout, email verification, password reset, and server-side session management.

### Project Structure
Organized into `client/` (React frontend), `server/` (Express backend), and `shared/` (common code like Drizzle schemas and Zod validation).

### Build System
- **Development**: Vite dev server with HMR.
- **Production**: Vite builds client, esbuild bundles server.

## External Dependencies

### Database
- **PostgreSQL**: Primary database.

### UI/Styling
- **Radix UI**: Headless component primitives.
- **shadcn/ui**: Component library.
- **Lucide React**: Icon library.

### Key NPM Packages
- **drizzle-orm / drizzle-kit**: ORM and migration.
- **passport / passport-local**: Authentication.
- **express-session / connect-pg-simple**: Session management.
- **zod / drizzle-zod**: Validation.
- **@tanstack/react-query**: Async state management.
- **react-hook-form / @hookform/resolvers**: Form handling.

### Replit-Specific Integrations
- **@replit/vite-plugin-runtime-error-modal**, **@replit/vite-plugin-cartographer**, **@replit/vite-plugin-dev-banner**: Development tooling.

### Email System
- **Provider**: Resend (via Replit connector integration).
- **Features**: Handles various notifications including welcome, task assignment, calendar invites, document uploads, new messages, and goal updates. Includes professional HTML templates.

### Admin Tools
- **Meeting Tracking System**: Admin page for monitoring all mentor-mentee meetings, including analytics and filtering capabilities.
- **Admin Analytics Dashboard**: Provides aggregate metrics and trends across users, cohorts, matches, meetings, tasks, goals, engagement, and journal activities.