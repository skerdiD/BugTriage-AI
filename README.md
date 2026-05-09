# BugTriage AI

BugTriage AI is an AI-powered issue triage platform that turns messy bug reports, screenshots, logs, and user complaints into structured engineering tickets.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma ORM
- Supabase Auth
- Supabase Storage
- Supabase Postgres
- Vercel AI SDK
- Gemini via `@ai-sdk/google`
- Zod

## Environment setup

Create `.env.local` and add:

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

SENTRY_DSN="your_server_sentry_dsn"
# Optional, but recommended if you want browser-side Sentry capture to use the same DSN.
NEXT_PUBLIC_SENTRY_DSN="your_public_sentry_dsn"
SENTRY_AUTH_TOKEN="your_sentry_auth_token_for_source_maps"
SENTRY_ORG="your_sentry_org_slug"
SENTRY_PROJECT="your_sentry_project_slug"
```

## Observability

Production observability is wired through Sentry with redacted event payloads.

- `SENTRY_DSN`: required for server and edge error capture.
- `NEXT_PUBLIC_SENTRY_DSN`: optional browser DSN. If omitted, the client falls back to `SENTRY_DSN`.
- `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`: required only if you want source maps uploaded during production builds.

Sensitive inputs such as cookies, authorization headers, AI prompts, uploaded log contents, and token-like values are redacted before logging or sending events to Sentry.

For production invite links and other server-generated absolute URLs, prefer setting `APP_URL`. The server now treats environment-based base URLs as trusted and avoids deriving production origins from forwarded host headers.

## Demo seed data

Demo seed data is opt-in and only targets a single existing account.

1. Create or sign in with `mirejemi896@gmail.com` first so the user record exists.
2. Set `SEED_DEMO_USER_EMAIL` in your local environment if you want to override the default target email.
3. Run `npm run db:seed` or `npx prisma db seed`.

What it does:

- Creates or reuses a dedicated demo workspace and project for the configured demo email.
- Seeds realistic ticket, comment, AI analysis, and activity data into that demo workspace only.
- Leaves every other user's workspace empty unless they create their own real tickets.

What it does not do:

- It does not auto-seed on sign-up.
- It does not inject frontend mock data into authenticated pages.
- It does not wipe the whole database or remove other users' data.
