# BugTriage AI

**BugTriage AI** is an AI-powered issue triage platform that turns messy bug reports, screenshots, logs, and user complaints into structured, developer-ready tickets.

It helps teams submit bug reports with reproduction steps, screenshots, logs, browser/device details, and context. AI then generates a clean summary, likely cause, suggested fix, severity, priority, tags, and confidence score inside a SaaS-style workspace.

[Live Demo](https://bug-triage-m6ht6jboe-skerdids-projects.vercel.app/) · [Repository](https://github.com/skerdiD/BugTriage-AI)

---

## Preview

### Landing Page

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
