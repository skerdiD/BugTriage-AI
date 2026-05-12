# BugTriage AI

**BugTriage AI** is an AI-powered issue triage platform built to turn messy bug reports into structured, developer-ready tickets.

It helps teams submit bug reports with screenshots, logs, reproduction steps, browser/device details, and context, then uses AI to generate a clear summary, likely cause, suggested fix, severity, priority, tags, and confidence score inside a clean SaaS-style workspace.

[Live Demo](https://bug-triage-ai.vercel.app/) · [Repository](https://github.com/skerdiD/BugTriage-AI) · [Features](#features) · [Tech Stack](#tech-stack) · [Getting Started](#getting-started)

---

## Preview

### Live App

https://bug-triage-ai.vercel.app/

### Landing Hero

![BugTriage AI landing hero](./public/screenshots/landing-hero.png)

### Dashboard Overview

![BugTriage AI dashboard overview](./public/screenshots/dashboard-overview.png)

### Submit Bug Flow

![BugTriage AI submit bug flow](./public/screenshots/submit-bug-flow.png)

### Tickets List

![BugTriage AI tickets list](./public/screenshots/tickets-list.png)

### Ticket Detail and AI Analysis

![BugTriage AI ticket detail](./public/screenshots/ticket-detail-ai-analysis.png)

### Analytics Dashboard

![BugTriage AI analytics dashboard](./public/screenshots/analytics-dashboard.png)

---

## Overview

Bug reports are often unclear, incomplete, and scattered across messages, screenshots, support chats, and console logs. Developers then lose time trying to understand what happened, how serious the issue is, and what should be fixed first.

BugTriage AI solves this by turning raw bug reports into structured engineering tickets. Users can submit detailed bug information, upload supporting files, and let AI generate a cleaner ticket with priority, severity, likely cause, suggested fix, and reproduction guidance.

The goal of this project was to build more than an AI wrapper. It demonstrates full-stack SaaS product thinking, AI integration, authenticated workspaces, database modeling, file storage, validation, security, observability, testing, and production-style engineering.

---

## Features

### AI Bug Triage

* Generate structured tickets from messy bug reports
* Create AI summaries, likely causes, suggested fixes, and reproduction guidance
* Assign severity, priority, category, tags, and confidence score
* Validate AI output with schema-based checks
* Handle AI failure gracefully without losing the submitted ticket
* Protect prompts against unsafe or malicious user input

### Bug Submission

* Submit bug title, description, expected behavior, and actual behavior
* Add steps to reproduce
* Include browser, device, environment, and affected page
* Paste console logs or diagnostic text
* Upload screenshots, logs, or supporting files

### Ticket Management

* View, search, and filter tickets
* Organize tickets by workspace and project
* Track ticket status, severity, category, and priority
* Open detailed ticket pages
* Add comments and follow ticket activity

### Workspaces and Teams

* Supabase authentication
* Workspace-based organization
* Member roles for owners, admins, and members
* Invite users into a workspace
* Keep tickets separated by workspace and project

### Analytics and Activity

* Dashboard overview for ticket activity
* Ticket counts by status and severity
* Recent activity tracking
* Activity events for ticket creation, AI analysis, comments, attachments, and status changes

### Security and Reliability

* Workspace-level authorization
* Private attachment storage
* Sensitive text redaction
* Prompt size limits
* AI timeout and retry handling
* Safer URL handling
* Sentry monitoring
* Arcjet protection setup
* CI pipeline with linting, typechecking, unit tests, E2E tests, and production build checks

---

## Tech Stack

### Frontend

* Next.js App Router
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Radix UI
* Lucide React
* Recharts
* React Hook Form
* Zod

### Backend and Database

* Next.js server actions
* Next.js server components
* Prisma ORM
* Supabase Postgres
* Supabase Auth
* Supabase Storage

### AI Layer

* Vercel AI SDK
* Google Gemini through `@ai-sdk/google`
* Structured AI output
* Zod validation
* Prompt redaction and size control

### Testing, Security, and Deployment

* Vitest
* Playwright
* GitHub Actions CI
* Sentry
* Arcjet
* Vercel

---

## Architecture Overview

BugTriage AI uses a full-stack Next.js architecture with Supabase for authentication, database, and storage, Prisma for typed database access, and Gemini for structured AI ticket analysis.

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

Server and Data Layer
  |-- Server Components
  |-- Server Actions
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

## Product Flow

1. A user opens the landing page and signs in.
2. The user enters a workspace.
3. The user creates or selects a project.
4. The user submits a bug report with details, logs, and optional attachments.
5. BugTriage AI analyzes the report and generates structured ticket metadata.
6. The ticket, AI analysis, attachments, and activity events are saved.
7. The team reviews the ticket, updates status, adds comments, and tracks progress.
8. Analytics show ticket volume, severity, status, and recent activity.

---

## Main Pages

### Landing Page

Marketing page with product positioning, problem explanation, AI triage value, feature sections, trust messaging, and calls to action.

### Dashboard

Workspace overview with ticket stats, recent activity, project context, and AI-assisted triage insights.

### Submit Bug

Form-based bug submission flow for report details, reproduction steps, environment information, logs, and attachments.

### Tickets

Ticket management page with search, filters, status badges, severity indicators, and ticket detail navigation.

### Ticket Detail

Detailed ticket page with original report, AI analysis, attachments, comments, metadata, and activity history.

### Analytics

Reporting page for ticket volume, status distribution, severity distribution, and workspace quality signals.

### Team and Settings

Workspace member management, invite flow, roles, and workspace configuration.

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/skerdiD/BugTriage-AI.git
cd BugTriage-AI
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create environment variables

Create a `.env.local` file in the project root.

```env
DATABASE_URL="your_supabase_postgres_database_url"

NEXT_PUBLIC_SUPABASE_URL="your_supabase_project_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="optional_if_you_prefer_publishable_key_naming"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET="bugtriage-private"

GOOGLE_GENERATIVE_AI_API_KEY="your_gemini_api_key"

APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

ARCJET_KEY="your_arcjet_key"

SENTRY_DSN="your_server_sentry_dsn"
NEXT_PUBLIC_SENTRY_DSN="your_public_sentry_dsn"
SENTRY_LOGS_ENABLED="true"
NEXT_PUBLIC_SENTRY_LOGS_ENABLED="true"
NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE="1"
NEXT_PUBLIC_SENTRY_REPLAYS_ERROR_SAMPLE_RATE="1"
SENTRY_AUTH_TOKEN="your_sentry_auth_token_for_source_maps"
SENTRY_ORG="your_sentry_org_slug"
SENTRY_PROJECT="your_sentry_project_slug"
```

### 4. Generate Prisma client

```bash
npm run db:generate
```

### 5. Push or migrate the database schema

```bash
npm run db:push
```

or:

```bash
npm run db:migrate
```

### 6. Start the development server

```bash
npm run dev
```

The app should run at:

```txt
http://localhost:3000
```

---

## Demo Seed Data

BugTriage AI includes opt-in demo seed data for a single existing account.

### Demo account

```txt
mirejemi896@gmail.com
```

### Optional seed email override

```env
SEED_DEMO_USER_EMAIL="your_demo_email@example.com"
```

### Run seed

```bash
npm run db:seed
```

or:

```bash
npx prisma db seed
```

The seed creates a demo workspace, demo project, realistic tickets, AI analysis records, comments, and activity events for the configured demo user.

---

## Available Scripts

```bash
npm run dev          # Start the development server
npm run build        # Generate Prisma client and build for production
npm run start        # Start the production server
npm run lint         # Run ESLint with zero warnings allowed
npm run typecheck    # Run TypeScript type checks
npm run test         # Run unit tests
npm run test:unit    # Run Vitest unit tests
npm run test:e2e     # Run Playwright E2E tests
npm run check        # Run lint, typecheck, tests, and build
npm run db:generate  # Generate Prisma client
npm run db:push      # Push Prisma schema to database
npm run db:migrate   # Run Prisma development migrations
npm run db:seed      # Seed demo data
```

---

## Testing

BugTriage AI includes tests for important product and security areas, including:

* AI output validation
* bug report validation
* authorization
* auth callback handling
* dashboard reporting
* demo seed behavior
* sensitive data redaction
* Sentry sanitization
* storage security
* submit bug action
* ticket detail rendering
* ticket data access
* workspace invites
* workspace member management
* Playwright E2E smoke coverage

The GitHub Actions CI workflow runs linting, typechecking, unit tests, E2E smoke tests, and a production build.

---

## Observability

Production observability is wired through Sentry with redacted event payloads.

```env
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_LOGS_ENABLED=true
NEXT_PUBLIC_SENTRY_LOGS_ENABLED=true
NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE=
NEXT_PUBLIC_SENTRY_REPLAYS_ERROR_SAMPLE_RATE=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
```

Replay is enabled in the browser with Sentry's privacy defaults reinforced
(`maskAllText`, `maskAllInputs`, and `blockAllMedia`). Logs are enabled for
Sentry structured logs and console warnings/errors. Metrics include Sentry's
server runtime metrics plus a `bug_submission` counter emitted by the submit
bug workflow.

For production URLs, use:

```env
APP_URL="https://bug-triage-ai.vercel.app"
NEXT_PUBLIC_APP_URL="https://bug-triage-ai.vercel.app"
```

---

## What This Project Demonstrates

BugTriage AI demonstrates:

* Full-stack SaaS product architecture
* AI-powered workflow design
* Next.js App Router development
* TypeScript application structure
* Supabase authentication and storage
* PostgreSQL database modeling
* Prisma ORM usage
* Workspace-based multi-user logic
* Role-aware authorization
* File upload handling
* AI output validation
* Prompt-safety thinking
* Production error monitoring
* Automated tests and CI
* Vercel deployment
* Business-focused product thinking

---

## Business Value

BugTriage AI represents the type of internal AI tool that SaaS teams, agencies, freelancers, QA teams, and support teams could use to reduce the time spent translating user complaints into developer-ready tickets.

From a business perspective, it supports:

* Faster bug triage
* Cleaner communication between support and engineering
* Better prioritization of urgent issues
* More complete debugging context
* Less back-and-forth with users or clients
* Faster developer handoff
* Better visibility into product quality

The strongest value is not only the AI analysis, but the workflow around it: workspaces, projects, tickets, attachments, comments, activity history, team invites, analytics, validation, monitoring, and production-style engineering.

---

## Folder Structure

```txt
BugTriage-AI/
├── .github/
│   └── workflows/           GitHub Actions CI workflow
├── prisma/
│   ├── schema.prisma        Database schema
│   └── seed.ts              Demo seed data
├── public/                  Static assets and screenshots
├── src/
│   ├── app/                 Next.js App Router pages and layouts
│   ├── components/          Reusable UI components
│   └── lib/                 Auth, AI, data, security, validation, and utilities
├── tests/                   Unit and E2E tests
├── components.json          shadcn/ui configuration
├── next.config.ts           Next.js configuration
├── package.json             Scripts and dependencies
├── playwright.config.ts     Playwright configuration
├── prisma.config.ts         Prisma configuration
├── tsconfig.json            TypeScript configuration
├── vitest.config.ts         Vitest configuration
└── README.md
```

---

## Author

Built by **skerdiD**.

GitHub: [@skerdiD](https://github.com/skerdiD)
