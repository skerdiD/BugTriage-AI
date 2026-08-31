# BugTriage AI

> AI-powered issue triage for engineering teams, built as a production-minded full-stack SaaS project.

BugTriage AI turns incomplete bug reports, screenshots, logs, and user complaints into structured developer-ready tickets.
It combines multi-tenant ticket management, asynchronous AI analysis, semantic duplicate detection, private file handling, analytics, and GitHub Issues export.
[Live Demo](https://bug-triage-ai.vercel.app) · [Repository](https://github.com/skerdiD/BugTriage-AI)

---

## Demo Account

Use **Continue as Demo User** on the sign-in page, or sign in with:

```text
Email: demo@bugtriage.ai
Password: Demo1234!
```

The shared demo workspace is read-only.
Its teammates, tickets, activity, attachments, and AI results are synthetic demo data and may be reset.

---

## Product Preview

Six screenshots cover the real product workflow; a landing-page screenshot is intentionally omitted.

### Engineering Dashboard

![Engineering Dashboard](./docs/screenshots/dashboard.png)

### Ticket Workspace

![Ticket Workspace](./docs/screenshots/tickets.png)

### Bug Submission

![Bug Submission](./docs/screenshots/submit-bug.png)

### Ticket Detail and AI Analysis

![Ticket Detail and AI Analysis](./docs/screenshots/ticket-detail.png)

### Analytics

![Analytics](./docs/screenshots/analytics.png)

### Team Workspace

## ![Team Workspace](./docs/screenshots/team.png)

## Overview

BugTriage AI is a full-stack issue triage platform designed to model a real engineering SaaS workflow rather than a basic CRUD demo.
A user submits a bug inside a workspace and project.
The server authenticates the user, validates tenant access, stores the ticket, creates a durable analysis dispatch, and returns without waiting for Gemini.
A separate BullMQ worker reloads authoritative ticket data, performs structured AI triage, validates the result with Zod, persists analysis history, generates an embedding, and updates semantic search.
The UI exposes the original report, processing state, AI result, similar issues, comments, activity, attachments, assignee information, analytics, and GitHub export state.
The project focuses on reliability, tenant isolation, asynchronous processing, secure file access, observability, and maintainable server-side boundaries.
----------------------------------------------------------------------------------------------------------------------------------------------------------

## What the App Solves

Bug reports are often incomplete or inconsistent.
Developers may receive vague descriptions, partial reproduction steps, screenshots, logs, and environment details spread across different places.
BugTriage AI standardizes that input and reduces repetitive triage work before debugging starts.
The system helps teams:

* Capture structured bug reports
* Organize issues by workspace and project
* Track status, severity, priority, and assignee
* Generate structured AI triage
* Suggest likely causes and fixes
* Detect semantically similar issues
* Keep comments and activity with the ticket
* Store attachments privately
* Track engineering trends
* Export clean issues to GitHub

---

## Core User Flow

```text
Submit bug
  -> authenticate + authorize workspace/project
  -> validate input
  -> create Ticket + TicketAnalysisDispatch
  -> return ticket immediately
  -> publish ticketId to Redis / BullMQ
  -> standalone worker reloads ticket
  -> Gemini triage + Zod validation
  -> persist analysis + history
  -> generate/upsert embedding
  -> pgvector similar-issue search
```

## The user-facing request stays fast while expensive AI work happens asynchronously.

## Key Features

### AI Bug Triage

* Engineering summary, severity, priority, category, tags, and confidence score
* Likely-cause analysis and suggested fix
* Normalized reproduction steps
* Zod-validated structured output
* Current analysis plus historical analysis runs
* Helpful / not-helpful feedback
* Safe manual re-analysis
* Sensitive-text redaction before AI processing

### Semantic Similar-Issue Search

* Gemini embeddings stored as 768-dimensional pgvector values
* Ticket, workspace, and project metadata kept beside vectors
* Workspace-scoped candidate filtering
* Project-aware similarity context
* Meaning-based matching instead of exact keyword matching
* Server-authorized similarity results
* Embedding backfill for existing analyzed tickets
* Content hashes to avoid unnecessary refresh work

### Bug Submission

* Title, description, expected behavior, and actual behavior
* Reproduction steps
* Browser, device, environment, and affected page
* Diagnostic context
* Screenshot, log, JSON, and supporting-file uploads
* Server-side input and tenant validation

### Ticket Management

* Workspace-scoped ticket list with project-aware organization
* Search and filtering
* Status, severity, category, priority, and assignee tracking
* Ticket detail pages with AI processing states
* Comments and activity history
* Private attachments
* GitHub export state
* Safe manual AI retry

### Workspaces and Teams

* Supabase authentication and protected dashboard routes
* Workspace membership and project organization
* Owner, admin, and member roles
* Workspace invitations with expiration and revocation
* Workspace-level authorization
* Tenant-scoped relational constraints

### Analytics and Integrations

* Engineering dashboard with workspace-scoped metrics
* Ticket totals, status breakdowns, severity breakdowns, and recent activity
* Recharts visualizations
* Server-side GitHub Issues export
* Stored GitHub issue URL, number, and export status
* Private Supabase Storage with temporary signed download URLs

---

## Architecture

```text
Next.js / React UI
      |
Supabase Auth + workspace authorization
      |
Server Actions / Route Handlers / Prisma
      |
PostgreSQL ----> Private Supabase Storage
      |                 |
Outbox            Signed URLs
      |
Redis / BullMQ
      |
Node.js Worker -> Gemini -> Zod -> pgvector
```

The web app owns user-facing requests; PostgreSQL owns durable state.
Redis/BullMQ coordinates asynchronous work and the worker owns long-running AI processing.
pgvector provides semantic retrieval while tenant metadata stays enforced beside each vector.
---------------------------------------------------------------------------------------------

## Reliable Background Processing

AI analysis is intentionally not executed inside the ticket-creation request.
Ticket creation stores the report and a `TicketAnalysisDispatch` outbox record before queue publication is attempted.
This prevents a successful database write from silently losing requested AI work when Redis is unavailable.
The queue receives a minimal payload containing the ticket identifier.
The worker reloads authoritative data from PostgreSQL rather than trusting a large serialized job payload.

### Processing State

```text
PENDING
   |
   v
PROCESSING
   |
   +------> COMPLETED
   |
   +------> FAILED
```

The ticket stores processing status, timestamps, job identity, error state, and the user who requested analysis.
Analysis runs are stored separately so re-analysis preserves history instead of replacing every previous result.

### Dispatch Retries

Queue publication and queue processing are different failure domains.
The republisher scans recoverable PostgreSQL outbox rows and attempts publication again.
Concurrent republishers atomically claim work in PostgreSQL.
Stable BullMQ job IDs make recovered publication safe after ambiguous failures.

### Processing Retries

BullMQ gives AI processing multiple attempts with exponential backoff.
Worker concurrency is configurable so Gemini and PostgreSQL are not overloaded.
Permanent processing failures move the ticket to an explicit failed state instead of deleting the original report.

### Idempotency

Retries and duplicate delivery are expected possibilities in distributed workflows.
The worker uses stable processing identity and repeat-safe persistence.
Embedding writes use upsert behavior.
Manual re-analysis creates a new logical operation so intentional new work is not confused with an automatic retry.

### Eventual Consistency

A ticket can exist before its AI analysis is ready.
That is intentional: the ticket is returned quickly while AI moves through pending and processing states in the background.
The UI represents those intermediate states instead of blocking the original request.
-------------------------------------------------------------------------------------

## Data Model

Important Prisma models:

* `User`
* `Workspace`
* `WorkspaceMember`
* `WorkspaceInvite`
* `Project`
* `Ticket`
* `TicketAnalysisDispatch`
* `TicketAiAnalysis`
* `TicketAiAnalysisRun`
* `TicketEmbedding`
* `TicketAttachment`
* `TicketComment`
* `TicketActivity`
  Projects are scoped to workspaces.
  Tickets reference project and workspace together.
  Embeddings keep ticket, workspace, and project metadata together through composite relational constraints.
  This adds database-level protection against accidental cross-tenant associations.

---

## Security

### Authorization

* Authenticated routes require a valid Supabase session
* Workspace membership is checked before workspace data is returned
* Project access is validated against the workspace
* Ticket access is scoped through its workspace
* Team-management actions are role-aware
* Sensitive actions do not trust client-provided ownership

### Private Files

Attachments are stored in a private Supabase Storage bucket.
The application stores metadata and storage paths instead of permanent public URLs.
The server checks ticket access before creating a temporary signed download URL.

### AI and Abuse Protection

User input and AI responses are treated as untrusted runtime data.
Sensitive patterns are redacted before model processing where applicable.
AI responses must pass the expected Zod schema before persistence.
Arcjet protects abuse-sensitive paths with request controls and rate limiting.

### Secrets

Database credentials, service-role keys, Redis credentials, GitHub tokens, Gemini keys, Arcjet keys, and Sentry credentials remain server-side.
Production secrets belong in deployment secret stores and never in source control.
----------------------------------------------------------------------------------

## Observability

Sentry provides production error monitoring.
The worker emits structured operational logs around background processing.
Useful telemetry includes ticket/operation ID, attempt number, processing status, duration, and failure category.
Report contents and credentials should not be written into operational logs.
----------------------------------------------------------------------------

## Tech Stack

### Frontend

* Next.js 16 App Router
* React 19
* TypeScript 5
* Tailwind CSS 4
* shadcn/ui + Radix UI
* React Hook Form + Zod
* Recharts

### Backend and Data

* Next.js Server Actions and Route Handlers
* Node.js
* Prisma 7
* PostgreSQL
* Supabase Auth
* Supabase Storage
* pgvector

### AI and Async

* Vercel AI SDK
* Google Gemini
* Gemini embeddings
* Redis + BullMQ + ioredis
* Standalone Node.js worker
* PostgreSQL transactional outbox
* Scheduled dispatch republisher
* Embedding backfill script

### Quality and Delivery

* Arcjet
* Sentry
* Vitest
* Playwright
* PostgreSQL / pgvector integration tests
* ESLint + TypeScript
* GitHub Actions
* Vercel
* Docker Compose

---

## Getting Started

### 1. Requirements

Use a supported Node.js version from `package.json`.
You also need PostgreSQL, Supabase, a Gemini API key, and Redis.

### 2. Clone and Install

```bash
git clone https://github.com/skerdiD/BugTriage-AI.git
cd BugTriage-AI
npm install
```

### 3. Environment Variables

Create `.env.local` and use `.env.example` as the source of truth.

```env
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=bugtriage-private
GOOGLE_GENERATIVE_AI_API_KEY=
REDIS_URL=
BULLMQ_WORKER_CONCURRENCY=3
REDIS_ALLOW_INSECURE_CONNECTION=false
GITHUB_TOKEN=
GITHUB_REPOSITORY_OWNER=
GITHUB_REPOSITORY_NAME=
ARCJET_KEY=
APP_URL=
NEXT_PUBLIC_APP_URL=
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
```

Use a native Redis URL for BullMQ.
For Upstash over TLS, use the `rediss://` connection string rather than REST credentials.

### 4. Start Local Redis

```bash
docker compose up -d redis
```

Set `REDIS_URL=redis://localhost:6379`.

### 5. Prepare the Database

```bash
npx prisma migrate dev
npx prisma generate
npm run seed:demo
```

### 6. Run the App

```bash
npm run dev
```

Run the worker in a second terminal:

```bash
npm run worker:dev
```

## Open `http://localhost:3000`.

## Available Scripts

`npm run dev` — Start Next.js development
`npm run build` — Generate Prisma client and build
`npm run start` — Start production web server
`npm run worker` — Start production BullMQ worker
`npm run worker:dev` — Start worker with file watching
`npm run republish` — Retry recoverable outbox dispatches
`npm run backfill:embeddings` — Refresh missing or stale embeddings
`npm run lint` — Run ESLint
`npm run typecheck` — Generate Next types and run TypeScript
`npm run test` / `test:unit` — Run Vitest
`npm run test:db` — Run database integrity tests
`npm run test:e2e` — Run Playwright
`npm run check` — Run lint, types, unit tests, and build
`npm run seed:demo` — Create or reset demo data
`npm run db:migrate` / `db:deploy` — Apply migrations
-----------------------------------------------------

## Testing and CI

Vitest covers utilities, validators, and server-side logic.
Database tests run against PostgreSQL with pgvector enabled.
Playwright covers browser-level behavior.
GitHub Actions runs lint, type checks, unit tests, database tests, a Playwright smoke test, and a production build.
-------------------------------------------------------------------------------------------------------------------

## Trade-Offs

The async architecture adds Redis, a worker, outbox state, retry logic, and deployment complexity.
It also introduces eventual consistency because a ticket can exist before AI analysis completes.
In return, the system gains faster requests, recoverable jobs, controlled concurrency, retry support, idempotent delivery handling, explicit failure states, and clearer web/worker separation.
For a smaller product, synchronous processing would be simpler.
Here, the additional architecture demonstrates reliability patterns needed when expensive external work becomes part of a real product workflow.
------------------------------------------------------------------------------------------------------------------------------------------------

## Engineering Highlights

This project goes beyond CRUD by combining:

* Multi-tenant workspace authorization
* Composite tenant integrity
* Transactional outbox dispatch
* Redis + BullMQ background processing
* Retry and exponential backoff
* Idempotent processing
* Eventual consistency
* Structured AI output validation
* AI analysis history and feedback
* Semantic search with pgvector
* Private object storage and signed URLs
* GitHub Issues integration
* Arcjet abuse protection
* Sentry monitoring
* Database integration testing
* Playwright browser testing
* GitHub Actions quality gates
  The goal is not complexity for its own sake.
  The goal is to show how a full-stack product can stay understandable while handling authentication, authorization, AI, queues, files, semantic search, integrations, failures, and deployment boundaries.

---

## Author

Built by [skerdiD](https://github.com/skerdiD).
