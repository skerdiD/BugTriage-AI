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
deployment configuration are retained. No writes, migrations, seeding, database
resets, or queue cleanup targeted the configured deployment database. Follow-up
mutation tests used isolated databases only. No Docker volumes were removed.

## Initial validation record (before Docker installation)

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

## Runtime verification follow-up — 2026-11-02

The initial runtime blockers are resolved for the Docker deployment. This follow-up
started from commit `be57988` with a clean working tree and retained the existing
Dockerfile and Compose configuration.

### Environment and isolation

- `docker info` passed: Docker Engine 29.9.2, Linux containers under Docker Desktop,
  with Compose v5.6.1 and BuildKit. The image uses Node 22.21.0. Host checks used the
  temporary supported Node 22.21.0 installation rather than system Node 22.14.
- Both configured external PostgreSQL URLs now resolve and accept read-only
  connections. `SELECT 1`, pgvector presence, and outbox-table presence passed.
  A one-shot container using the actual deployment environment also connected to
  external PostgreSQL, and Supabase Auth health returned HTTP 200. No credential
  changes were needed; the earlier PostgreSQL/DNS failures did not recur.
- The hosted `REDIS_URL` still returns `ENOTFOUND`. It is not used by Compose:
  app, worker, and republisher all use `redis://redis:6379` as configured. Native
  deployments using that hosted URL still need a valid/resolvable endpoint.
- Runtime mutation tests ran in Compose project `bugtriage-verification`, with a
  temporary override and a separate pgvector PostgreSQL container. Its database was
  `bugtriage_docker_test`; Redis used the project's own volume. This is validation
  infrastructure only; production Compose still uses externally hosted PostgreSQL.
- Automated integration tests used a second database, `bugtriage_integration_test`,
  and Redis database 15, so the running republisher could not claim test-suite work.
  All 11 migrations applied successfully to isolated databases. Production
  database URLs and working `.env` secrets were neither overwritten nor mutated.
- Session-only overrides, selected runtime credentials, and the fixture probe live
  under `$env:TEMP/bugtriage-docker-audit-tools/`; no secrets were committed. The
  runtime probe rejects any database other than `test-postgres/bugtriage_docker_test`.

### Verified failure and fix

Stopping an idle worker with Redis unavailable reproduced a shutdown hang. The
worker's `maxRetriesPerRequest: null` left commands pending while `worker.close()`
waited for its main loop. Docker eventually killed the process: exit code **137**.
The republisher exited normally.

`src/workers/bug-analysis.worker.ts` now disconnects an already-offline owned Redis
connection before draining BullMQ and avoids queuing `QUIT` on a disconnected
connection. Healthy shutdown still waits for active jobs. After rebuilding and
recreating containers, the same offline shutdown completed within the 15-second
test limit; **both worker and republisher exited 0**. Two new unit cases cover
connected and reconnecting Redis shutdown order.

The integration suite gained three cases for actual BullMQ retry success, retry
exhaustion, and abandoned outbox-lease recovery. An initial new test assertion was
corrected to account for the existing ticket mapper omitting description; no
application behavior was changed for that assertion. A new shutdown test's signal
argument was also corrected after TypeScript caught it. Final checks below passed.

### Final validation results

| Check | Result and evidence |
| --- | --- |
| Compose configuration | Base, development override, and isolated runtime override validated successfully. |
| Image and production build | `docker compose build app` passed from a clean Linux dependency install and again after the shutdown fix. Prisma generation, Next compilation, TypeScript, and prerendering passed inside Docker. All application roles use this shared image. |
| Container startup | Migration service exited 0. App and Redis reached healthy status; worker logged `ready`; republisher repeatedly scanned the outbox. Worker/republisher have no Docker health check: their running state and actual job execution were checked. |
| HTTP and database readiness | Container-served `/`, `/login`, and `/api/health` returned 200. Health returned `{ "status": "ok" }` with `Cache-Control: no-store`. PostgreSQL `SELECT 1` and Redis `PONG` passed. Redis reported `noeviction`. |
| Image hygiene | Runtime UID was 1000. Neither `.env` nor `.env.local` existed in the image, and the image did not inherit a build-stage `DATABASE_URL`. |
| Live analysis | Application dispatch code inside the app container published a synthetic test report. The unmodified worker called real Gemini, completed the BullMQ job, and stored exactly one analysis plus a 768-dimensional embedding. |
| Scheduled republishing | A fixture created without direct publication was picked up by the separate periodic republisher and completed by the real worker with one analysis and embedding. |
| Redis outage and recovery | With Redis stopped, web/database readiness stayed 200 and direct publication returned pending. PostgreSQL retained the dispatch (`PENDING`, two attempts observed). After Redis returned, the republisher delivered it on dispatch attempt three and analysis completed. |
| Processing failures | Real-container invalid-report processing failed permanently after one attempt and retained the report. Integration tests exercised two transient failures followed by success on attempt three, and terminal failure after all three attempts. |
| Graceful active-job shutdown | A SIGTERM during a live Gemini job logged shutdown start, job completion, then graceful shutdown completion before the worker restarted. No analysis was duplicated. |
| Offline shutdown | After the fix, worker and republisher exited 0 while Redis was stopped; no forced kill was needed. |
| Abrupt process failure | Killing the worker's Node process inside the isolated container incremented Docker's restart count to one. BullMQ recovered the interrupted job after its stalled-job checks; it completed with one analysis and embedding. |
| Restart persistence | App, worker, republisher, and Redis were restarted together. The original completed job and database results remained present; a fresh report completed through the republisher afterward. |
| Regression checks | ESLint and `npm run typecheck` passed. **238 unit tests in 46 files**, **9 integration tests in 2 files**, and **11 Chromium smoke tests against the Docker app** passed. |

The browser smoke suite checked public/auth pages and unauthenticated redirects.
Backend job fixtures used application dispatch code and real container processes;
an authenticated HTTP report submission was not automated. Integration retry tests
use deterministic provider responses but real PostgreSQL, pgvector, Redis, BullMQ,
and the production processor. Live container completion checks used actual Gemini.

### Remaining follow-up

- No Docker runtime or backend job-processing check remains blocked.
- The unused hosted Redis endpoint still needs DNS/configuration repair for any
  non-Compose deployment that relies on it. Its secret value was left unchanged.
- The existing dependency lockfile has security advisories. The clean image install
  reported 39 total advisories including development dependencies; a production-only
  `npm audit --omit=dev --json` reported 20 (2 critical, 7 high, 7 moderate, 4 low).
  The critical entries include `next` and `@sentry/nextjs`. Dependency remediation
  requires a separate compatibility review; no dependency versions were changed
  during this runtime verification. Runtime success does not resolve those advisories.
- The isolated validation services and volumes are retained for inspection. The
  verification app is on `http://127.0.0.1:3100`; the standard deployment remains
  configured for loopback port 3000. No production stack was started to process
  existing deployment outbox rows.

## Commands for repeating validation

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

Final verdict: **YES — the Docker runtime and backend end-to-end checks passed**
using the existing image/Compose architecture and isolated mutation targets.
The hosted Redis DNS issue and dependency advisories above remain separate follow-up.
