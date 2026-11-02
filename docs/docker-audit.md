# Docker audit and validation

Audited on 2026-11-02 before changing application or infrastructure files.

## Architecture traced

- `npm run build` generates Prisma Client and builds Next.js 16.3. The Docker image
  uses Node 22.21 and standard `next start`; there is no standalone output setting.
  The shared runtime includes Prisma CLI, TypeScript, and tsx deliberately: migrations,
  the TypeScript Next config, and standalone workers need them. It runs as `node`.
- Server Actions authenticate with Supabase, write tickets plus a PostgreSQL outbox,
  and attempt identifier-only BullMQ publication. Prisma 7 uses the pg adapter.
  `DIRECT_URL` is for CLI migration access; runtime queries use `DATABASE_URL`.
- All Compose producers and consumers use the bundled Redis service. Redis uses
  AOF, a persistent named volume, and `noeviction`. No Redis host port is needed.
- BullMQ processes `analyze-ticket` with three attempts and exponential backoff
  starting at two seconds. The processor reloads the ticket, calls Gemini, persists
  AI history, stores a pgvector embedding, then marks completion. Permanent failures
  become unrecoverable BullMQ errors and failed ticket state.
- The outbox republisher atomically claims pending/stale dispatches with a 60-second
  lease, stable IDs, bounded batches, and eight publication attempts. Terminal
  dispatch failure updates ticket state. It needs a scheduler outside web requests.
- Compose runtime files load `.env` then `.env.local`. Compose interpolation/build
  arguments require `.env` or explicit `--env-file` options. Browser public variables
  freeze at build time; server secrets remain runtime inputs.

## Verified initial problems and changes

| File | Verified problem | Change |
| --- | --- | --- |
| `docker-compose.yml` | Hardcoded local database URLs overrode external configuration and required a local PostgreSQL service. | Removed the local service/dependency; require the configured external URL and fall back to it for direct migration access. Existing database volumes/data were not removed. |
| `docker-compose.yml` | Redis was publicly published on port 6379. | Keep Redis private; provide an explicit loopback-only `docker-compose.dev.yml` override for host development. |
| `src/workers/ticket-analysis-republisher.ts`, Compose | CLI ran once; no periodic Compose process existed. | Add one dedicated sequential `--watch` service with an abortable interval, transient-error recovery, and cleanup after active batches. Preserve one-shot behavior. |
| `src/lib/prisma.ts` | Each production property access created another client/pool; `$disconnect` targeted a new client. | Reuse one lazy client per process, bind methods to it, and bound connection acquisition to five seconds. |
| `src/lib/queue/bug-analysis-worker.ts` | Stalled redelivery could see an unexpired database lease and incorrectly complete the BullMQ job with `processing` status. | Move that delivery to delayed state without consuming a processing failure, then reclaim after the lease expires. |
| `src/lib/queue/bug-analysis.ts`, `redis.ts` | BullMQ waits indefinitely for initial readiness despite producer `maxRetriesPerRequest=1`; verified against a closed local port. Cleanup could wait on that same initialization. | Check initial readiness through a bounded Redis command, retain the durable outbox on failure, disconnect offline clients before closing, and bound producer command time. Healthy cold connections can still publish in one-shot processes. Workers retain unlimited blocking-connection retries. |
| `src/lib/supabase/env.ts`, `prisma.config.ts` | Empty optional environment values prevented anonymous/publishable key, storage bucket, and direct database URL fallbacks. Docker build arguments defaulted these values to empty. | Treat blank optional values as absent. Fail Docker builds clearly if public Supabase configuration is absent. |
| `Dockerfile`, Compose | npm wrapped the main processes; Docker's default stop timeout was too short for in-flight AI work. Build caches were copied into runtime. | Start Node directly, use Compose init and 90-second grace periods, cache npm downloads, disable Next telemetry, and omit Next build cache. Keep the non-root shared runtime and standard Next output. |
| Compose HTTP health check | Only the public landing page was checked, so a broken database could go unnoticed. | Add an uncached, dynamic `/api/health` endpoint that performs `SELECT 1` and returns a generic 503 on failure. |
| `README.md`, `.env.example` | No complete Docker workflow or explanation of build/runtime environment precedence. | Document startup, migrations, private networking, republisher ownership, recovery checks, and explicit env-file selection. |

The Prisma schema/migrations, application UI, Supabase architecture, and Vercel
deployment configuration are retained. No production writes, migrations, seeding,
database resets, volume removal, or queue cleanup were performed during this audit.

## Validation record

- Portable Docker Compose v5.6.1: `config --quiet` passed for the base configuration
  and the development override. Programmatic checks confirmed no PostgreSQL service,
  no base Redis port, loopback web binding, matching Redis URLs, and external DB use.
- Final lint and all 236 unit tests (45 files) passed under a temporary Node
  22.21.0 installation. `npm run typecheck` passed; the final `npm run build` also
  generated Prisma Client and passed Next compilation, TypeScript, and prerendering.
  The system Node 22.14 is below this repository's supported version range.
- `npm ci --dry-run --ignore-scripts --no-audit --no-fund` passed, confirming the
  manifest/lockfile install plan. This was not a clean Linux dependency installation.
- The built native production server started successfully on loopback port 3100.
  `/` and `/login` returned 200. `/api/health` correctly returned an uncached generic
  503 while PostgreSQL was unavailable. Healthy database readiness remains unverified.
- A real disconnected-Redis test using the production publisher reproduced the old
  readiness wait, then verified bounded failure and complete producer cleanup after
  the fix (153 ms against a closed local port). Unit tests also cover healthy cold
  publication, deferred stalled delivery, retries, and periodic-loop shutdown/recovery.
- Docker image build, service startup, and status inspection were attempted using
  the real Compose executable. All were blocked by the absent Docker Engine pipe
  `//./pipe/docker_engine`. Neither Docker Engine/Desktop nor WSL is installed.
- Both configured external PostgreSQL URLs failed read-only connection attempts:
  the initial attempt returned PostgreSQL code `XX000`; repeat attempts failed DNS
  resolution with `ENOTFOUND`. Hosted Redis also failed DNS resolution (`ENOTFOUND`).
  These endpoints/network settings need to be usable before end-to-end validation.
  No credentials or complete error text were logged.
- `npm run test:db` was attempted and correctly stopped in its safety precheck:
  the configured database is not a dedicated `_test` database. No migration ran.
- Container HTTP readiness, actual BullMQ jobs, outbox recovery, restart recovery,
  and signal delivery require Docker and usable external services; they remain
  unverified. Mocked tests are not a substitute for those checks.

## Commands to finish container validation

Install/start Docker Engine (Linux containers), supply usable external PostgreSQL,
Supabase, and Gemini configuration, then run the Docker commands in the README.
Use `--env-file .env.local` on every command if that file holds the deployment values.

```bash
docker compose config --quiet
docker compose build app
docker compose up -d --wait app worker republisher
docker compose ps -a
docker compose logs --tail=100 migrate app worker republisher redis
curl --fail http://127.0.0.1:3000/api/health
docker compose exec redis redis-cli ping
docker compose restart worker republisher redis
docker compose ps -a
curl --fail http://127.0.0.1:3000/api/health
```

Check that `migrate` exited 0, the app and Redis are healthy, and the worker logs
`ready`. Follow the README's report submission and Redis outage/recovery procedure
to verify persisted job results and periodic republishing with real services.

For the existing integration suite, create a **separate disposable test database**.
This local PostgreSQL is test infrastructure only; production Compose still uses
the external database. The suite clears its isolated Redis database 15 and deletes
its own fixture records. Do not target production Redis or application databases.

```powershell
docker run -d --name bugtriage-audit-test-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=bugtriage_ai_test -p 127.0.0.1:55432:5432 pgvector/pgvector:pg16
docker run -d --name bugtriage-audit-test-redis -p 127.0.0.1:56379:6379 redis:7.4-alpine
docker exec bugtriage-audit-test-db pg_isready -U postgres -d bugtriage_ai_test
docker exec bugtriage-audit-test-redis redis-cli ping
$env:DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:55432/bugtriage_ai_test'
$env:DIRECT_URL = $env:DATABASE_URL
$env:REDIS_URL = 'redis://127.0.0.1:56379/15'
npm.cmd run test:db
```

Run in a fresh terminal so the test-only environment overrides do not carry over
to later deployment commands. Wait for `pg_isready` and Redis `PONG` before running
the tests. The integration suite substitutes deterministic Gemini responses but
uses real PostgreSQL, pgvector, Redis, BullMQ, and the production processor.

Final verdict is **NO** until the blocked container and job-processing checks pass.
