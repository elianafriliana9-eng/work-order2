# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Work order management system for an IT team. Built with Next.js 16 (App Router) + Supabase (PostgreSQL, Auth, Storage). The Next.js app lives in `wo-2/`.

## Commands

All commands run from `wo-2/`:

```bash
cd wo-2
npm run dev      # Dev server on port 3000
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint (flat config, ESLint 9)
```

No test framework is configured.

## Architecture

### Tech Stack
- **Next.js 16** with App Router, React 19, TypeScript 5, Tailwind CSS 4
- **Supabase** for database (PostgreSQL), auth (Google OAuth), and file storage
- **Zustand** for client state, **React Hook Form + Zod** for forms
- **LiveKit** for video conferencing
- **googleapis** for Google Calendar integration
- **jspdf + html2canvas** for PDF report generation

### Supabase Client Pattern
The browser client in `src/lib/supabase.ts` uses a lazy-initialization proxy pattern to prevent crashes during Vercel SSR prerendering. Server-side code (middleware, API routes) creates its own client via `createServerClient` from `@supabase/ssr`.

### Role-Based Routing
Four roles defined in `src/lib/constants.ts`: `head_it`, `designer`, `it_dev`, `it_support`.

Middleware (`src/middleware.ts`) enforces access:
- `/admin/*` → `head_it` only
- `/team/design/*` → `designer` only
- `/dashboard/*`, `/new-ticket` → all authenticated users
- Unauthenticated users redirect to `/login`

### Work Order Workflow
Status progression: **Incoming → Verified → On Progress → Review → Completed/Rejected**

Categories: Programming, Design, Asset Management. Priorities: P1, P2, P3.

Key business rules (from REVISION_SOP.md):
- 24-hour revision window opens when status moves to "Review"
- Revisions classified as minor or major; concept changes require a new ticket
- Tickets auto-complete after 24 hours with no revision request
- Design submissions require Head IT approval

### Database Migrations
Located in `wo-2/supabase/migrations/`. Core tables: `profiles` (user roles), work orders (tickets with status/priority/category), `work_order_revisions` (revision tracking with triggers).

### API Routes (`src/app/api/`)
- `auth/` — Google OAuth flow
- `google/` — Google Calendar integration
- `livekit/` — LiveKit token generation for video meetings
- `revisions/` — Revision submission endpoint (Zod-validated)

## Key Context Files

- `Context.md` — Project vision, full workflow logic, database schema overview
- `procedure.md` — SOP documentation (in Indonesian): workflow, priority management, file naming conventions
- `REVISION_SOP.md` — Revision workflow rules, 24-hour window, classification guidelines

## Deployment

Deployed on **Vercel**. Environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, LiveKit credentials, Google OAuth credentials) are set in the Vercel dashboard and `.env.local` for local dev.
