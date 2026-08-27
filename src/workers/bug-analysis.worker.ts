import * as Sentry from "@sentry/nextjs";
import { UnrecoverableError, Worker } from "bullmq";

import "@/sentry.server.config";

import {
  BUG_ANALYSIS_JOB_NAME,
  BUG_ANALYSIS_QUEUE_NAME,
  parseBugAnalysisJob,
  type BugAnalysisJobData,
} from "@/lib/queue/bug-analysis";
import {
  createRedisConnection,
  getWorkerConcurrency,
} from "@/lib/queue/redis";
import {
  isRetryableTicketAnalysisError,
  processTicketAnalysis,
  recordTicketAnalysisFailure,
} from "@/lib/services/ticket-analysis";
import { prisma } from "@/lib/prisma";

const concurrency = getWorkerConcurrency();
const redis = createRedisConnection("worker");
const worker = new Worker<BugAnalysisJobData>(
  BUG_ANALYSIS_QUEUE_NAME,
  async (job) => {
    const startedAt = Date.now();
    let parsedJob: ReturnType<typeof parseBugAnalysisJob>;

    try {
      parsedJob = parseBugAnalysisJob({
        name: job.name,
        data: job.data,
        jobId: job.id,
      });
    } catch {
      console.warn("[bug-analysis-worker] rejected invalid job", {
        expectedJobName: BUG_ANALYSIS_JOB_NAME,
        hasJobId: Boolean(job.id),
      });
      throw new UnrecoverableError("Invalid bug analysis job.");
    }

    const { data, jobId } = parsedJob;

    const attempt = job.attemptsMade + 1;

    console.info("[bug-analysis-worker] job started", {
      jobId,
      ticketId: data.ticketId,
      attempt,
    });

    try {
      const result = await processTicketAnalysis({
        ticketId: data.ticketId,
        jobId,
      });

      console.info("[bug-analysis-worker] job completed", {
        jobId,
        ticketId: data.ticketId,
        attempt,
        durationMs: Date.now() - startedAt,
        resultStatus: result.status,
        similarIssueCount: result.similarIssueCount,
      });

      return result;
    } catch (error) {
      const retryable = isRetryableTicketAnalysisError(error);
      const maxAttempts = job.opts.attempts ?? 1;
      const willRetry = retryable && attempt < maxAttempts;

      await recordTicketAnalysisFailure({
        ticketId: data.ticketId,
        jobId,
        error,
        willRetry,
      });

      console.error("[bug-analysis-worker] job failed", {
        jobId,
        ticketId: data.ticketId,
        attempt,
        durationMs: Date.now() - startedAt,
        willRetry,
      });

      if (!retryable) {
        throw new UnrecoverableError("Ticket analysis failed permanently.");
      }

      throw error;
    }
  },
  {
    connection: redis,
    concurrency,
  }
);

worker.on("error", (error) => {
  Sentry.captureException(error, {
    tags: { area: "bullmq-worker", queue: BUG_ANALYSIS_QUEUE_NAME },
  });
  console.error("[bug-analysis-worker] worker error");
});

worker.on("ready", () => {
  console.info("[bug-analysis-worker] ready", {
    queue: BUG_ANALYSIS_QUEUE_NAME,
    concurrency,
  });
});

let shuttingDown = false;

async function shutdown(signal: "SIGINT" | "SIGTERM") {
  if (shuttingDown) return;
  shuttingDown = true;

  console.info("[bug-analysis-worker] graceful shutdown started", { signal });

  const shutdownErrors: unknown[] = [];

  try {
    await worker.close();
  } catch (error) {
    shutdownErrors.push(error);
    Sentry.captureException(error, {
      tags: { area: "bullmq-worker", action: "shutdown", resource: "worker" },
    });
    redis.disconnect();
  }

  const cleanupResults = await Promise.allSettled([
    redis.status === "end" ? Promise.resolve() : redis.quit(),
    prisma.$disconnect(),
  ]);

  for (const [index, result] of cleanupResults.entries()) {
    if (result.status === "fulfilled") continue;

    shutdownErrors.push(result.reason);
    const resource = index === 0 ? "redis" : "prisma";
    Sentry.captureException(result.reason, {
      tags: { area: "bullmq-worker", action: "shutdown", resource },
    });

    if (resource === "redis") redis.disconnect();
  }

  await Sentry.close(2_000);

  if (shutdownErrors.length === 0) {
    console.info("[bug-analysis-worker] graceful shutdown completed", { signal });
    process.exitCode = 0;
    return;
  }

  console.error("[bug-analysis-worker] graceful shutdown failed", {
    signal,
    failureCount: shutdownErrors.length,
  });
  process.exitCode = 1;
}

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});
