# BugTriage AI

**BugTriage AI** is an AI-powered issue triage platform that turns messy bug reports, screenshots, logs, and user complaints into structured, developer-ready tickets.

It helps teams submit bug reports with reproduction steps, screenshots, logs, browser/device details, and context. AI then generates a clean summary, likely cause, suggested fix, severity, priority, tags, and confidence score inside a SaaS-style workspace.

[Live Demo](https://bug-triage-m6ht6jboe-skerdids-projects.vercel.app/) · [Repository](https://github.com/skerdiD/BugTriage-AI)

---

## Preview

### Landing Page Hero

![BugTriage AI landing page hero](./public/landing-page-hero.png)

### AI Workflow Overview

![BugTriage AI workflow overview](./public/ai-workflow-overview.png)

### Engineering Dashboard

![BugTriage AI engineering dashboard](./public/engineering-dashboard.png)

### Submit Bug Report

![BugTriage AI submit bug report form](./public/submit-bug-report.png)

### Tickets Management

![BugTriage AI tickets management view](./public/tickets-management.png)

### Analytics Dashboard

![BugTriage AI analytics dashboard](./public/analytics-dashboard.png)

### Team Workspace

![BugTriage AI team workspace](./public/team-workspace.png)

---

## Overview

Bug reports are often unclear, incomplete, and scattered across messages, screenshots, support chats, and console logs. Developers then lose time trying to understand what happened, how serious the issue is, and what should be fixed first.

BugTriage AI solves this by turning raw bug reports into structured engineering tickets. Users can submit bug details, upload supporting files, and let AI generate a cleaner ticket with priority, severity, likely cause, suggested fix, and reproduction guidance.

This project is built to demonstrate full-stack SaaS product thinking, AI integration, authenticated workspaces, database modeling, file storage, GitHub Issues export, validation, security, monitoring, testing, and production-style engineering.

---

## Key Features

### AI Bug Triage

- Generate structured tickets from messy bug reports
- Create AI summaries, likely causes, suggested fixes, and reproduction guidance
- Assign severity, priority, category, tags, and confidence score
- Validate AI output with schema-based checks
- Handle AI failures gracefully without losing the submitted ticket
- Protect prompts with size limits, redaction, and safer input handling

### Bug Submission

- Submit title, description, expected behavior, and actual behavior
- Add steps to reproduce
- Include browser, device, environment, and affected page
- Paste console logs or diagnostic text
- Upload screenshots, logs, or supporting files

### Ticket Management

- View, search, and filter tickets
- Track ticket status, severity, category, and priority
- Open detailed ticket pages
- Add comments and follow activity history
- Organize tickets by workspace and project

### Workspaces and Teams

- Supabase authentication
- Workspace-based organization
- Member roles for owners, admins, and members
- Invite users into a workspace
- Keep tickets separated by workspace and project

### Analytics and Activity

- Dashboard overview for ticket activity
- Ticket counts by status and severity
- Recent activity tracking
- Activity events for ticket creation, AI analysis, comments, attachments, status changes, and team actions

### Security and Reliability

- Workspace-level authorization
- Private attachment storage
- Sensitive text redaction
- GitHub token validation
- AI timeout and retry handling
- Arcjet protection and rate limiting
- Sentry monitoring with secret redaction
- CI pipeline with linting, typechecking, tests, and production build checks

---

## Tech Stack

### Frontend

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Radix UI
- Lucide React
- Recharts
- React Hook Form
- Zod

### Backend and Database

- Next.js Server Actions
- Next.js Server Components
- Next.js API Routes
- Prisma ORM
- Supabase Postgres
- Supabase Auth
- Supabase Storage

### AI Layer

- Vercel AI SDK
- Google Gemini through `@ai-sdk/google`
- Structured AI output
- Zod validation
- Prompt redaction and size control

### Integrations, Security, and Deployment

- GitHub Issues REST API
- Sentry
- Arcjet
- Vitest
- Playwright
- GitHub Actions CI
- Vercel

---

## Architecture Overview

BugTriage AI uses a full-stack Next.js architecture with Supabase for authentication, database, and storage, Prisma for typed database access, Gemini for structured AI ticket analysis, and a server-side GitHub Issues export flow.

```txt
Next.js App
  |-- App Router
  |-- React
  |-- TypeScript
  |-- Tailwind CSS
  |-- Landing Page
  |-- Dashboard
  |-- Tickets
  |-- Submit Bug
  |-- Analytics
  |-- Team
  |-- Settings
  |-- Profile / Account

Server and Data Layer
  |-- Server Components
  |-- Server Actions
  |-- API Routes
  |-- Auth Guards
  |-- Workspace Access Checks
  |-- Ticket Actions
  |-- Dashboard Reporting
  |-- Prisma ORM
  |-- Supabase Postgres

AI Layer
  |-- Vercel AI SDK
  |-- Gemini
  |-- Structured Output
  |-- Summary
  |-- Likely Cause
  |-- Suggested Fix
  |-- Severity
  |-- Priority
  |-- Confidence Score

Integration Layer
  |-- GitHub Issues Export
  |-- Server-Side GitHub API Request
  |-- Token Validation
  |-- Rate Limiting
  |-- Safe Error Handling

Storage and Security Layer
  |-- Supabase Storage
  |-- Private Attachments
  |-- Sentry Monitoring
  |-- Arcjet Protection
  |-- Sensitive Data Redaction
  |-- Prompt Safety Checks

Testing and CI Layer
  |-- Vitest
  |-- Playwright
  |-- Lint
  |-- Typecheck
  |-- Production Build
```

---

## Supabase Storage Setup

BugTriage AI stores ticket screenshots and log files in Supabase Storage as private attachments. Uploads are performed only from server actions using the Supabase service role key; the service role key must never be exposed to the browser.

Create one Storage bucket in the Supabase dashboard:

- Bucket name: `bugtriage-private`
- Public bucket: `Off`
- File size limit: at least `10 MB`
- Allowed MIME types are optional in Supabase because the app validates files server-side:
  `image/png`, `image/jpeg`, `image/webp`, `text/plain`, `application/json`

The bucket name can be overridden with `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`, but the value in Vercel and Supabase must match exactly. If this variable is omitted, the app uses `bugtriage-private`.

Required Vercel environment variables:

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=bugtriage-private
```

`SUPABASE_SERVICE_ROLE_KEY` is server-only and is used for private Storage uploads, cleanup after failed ticket saves, and short-lived signed download URLs. Do not prefix it with `NEXT_PUBLIC_`.

Storage RLS policies are not required for ticket attachments because browser clients do not upload or read files directly. If you later move uploads to the browser, add authenticated Storage RLS policies before doing so.
