# SONSIEL Mentorship Hub

## Overview

SONSIEL Mentorship Hub is a comprehensive mentorship management platform designed for healthcare professionals. The platform connects mentors and mentees, facilitating professional development and career growth in the healthcare sector. It features role-based access control (Super Admin, Admin, Mentor, Mentee), multi-language support (English, Spanish, Portuguese), and a complete authentication system with email verification and password reset capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens following Material Design 3 principles
- **Theme**: Light/dark mode support with CSS variables for theming
- **Forms**: React Hook Form with Zod validation schemas

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy, session-based auth using express-session
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **Password Security**: Scrypt hashing with timing-safe comparison
- **API Pattern**: RESTful endpoints under `/api` prefix

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` contains all database schemas and Zod validation schemas
- **Migrations**: Managed via drizzle-kit with migrations stored in `/migrations`

### Authentication & Authorization
- **Role-Based Access Control**: Four roles (SUPER_ADMIN, ADMIN, MENTOR, MENTEE) with middleware guards
- **Security Features**: Account lockout after failed attempts, email verification tokens, password reset flow
- **Session Management**: Server-side sessions with PostgreSQL storage
- **Protected Routes**: Client-side route protection with profile completion enforcement

### Project Structure
```
├── client/src/          # React frontend application
│   ├── components/      # UI components (shadcn/ui in ui/, shared layouts)
│   ├── hooks/           # Custom React hooks (auth, mobile, toast)
│   ├── lib/             # Utilities (queryClient, protected routes)
│   └── pages/           # Page components
├── server/              # Express backend
│   ├── auth.ts          # Authentication logic
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Database operations layer
│   └── db.ts            # Database connection
├── shared/              # Shared code between client/server
│   └── schema.ts        # Drizzle schemas and Zod validation
└── migrations/          # Database migrations
```

### Build System
- **Development**: Vite dev server with HMR, proxied API requests
- **Production**: Vite builds client to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **Path Aliases**: `@/` for client source, `@shared/` for shared code

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Session Table**: Auto-created by connect-pg-simple for session storage

### UI Framework
- **Radix UI**: Headless component primitives for accessibility
- **shadcn/ui**: Pre-built component library using Radix primitives
- **Lucide React**: Icon library

### Key NPM Packages
- **drizzle-orm / drizzle-kit**: Database ORM and migration tooling
- **passport / passport-local**: Authentication framework
- **express-session / connect-pg-simple**: Session management
- **zod / drizzle-zod**: Runtime validation and schema generation
- **@tanstack/react-query**: Async state management
- **react-hook-form / @hookform/resolvers**: Form handling with Zod integration

### Replit-Specific
- **@replit/vite-plugin-runtime-error-modal**: Error overlay in development
- **@replit/vite-plugin-cartographer**: Development tooling
- **@replit/vite-plugin-dev-banner**: Development banner display