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
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET="bugtriage-private"

GOOGLE_GENERATIVE_AI_API_KEY="your_gemini_api_key"

NEXT_PUBLIC_APP_URL="http://localhost:3000"