import * as Sentry from "@sentry/nextjs";
import { UnrecoverableError, Worker } from "bullmq";

import {
  BUG_ANALYSIS_QUEUE_NAME,
  bugAnalysisJobDataSchema,
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

await import("@/sentry.server.config");

const concurrency = getWorkerConcurrency();
const redis = createRedisConnection("worker");
const worker = new Worker<BugAnalysisJobData>(
  BUG_ANALYSIS_QUEUE_NAME,
  async (job) => {
    const startedAt = Date.now();
    const data = bugAnalysisJobDataSchema.parse(job.data);
    const jobId = job.id;

    if (!jobId) {
      throw new UnrecoverableError("Analysis job is missing its stable job ID.");
    }

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

console.info("[bug-analysis-worker] ready", {
  queue: BUG_ANALYSIS_QUEUE_NAME,
  concurrency,
});

let shuttingDown = false;

async function shutdown(signal: "SIGINT" | "SIGTERM") {
  if (shuttingDown) return;
  shuttingDown = true;

  console.info("[bug-analysis-worker] graceful shutdown started", { signal });

  try {
    await worker.close();
    await redis.quit();
    await prisma.$disconnect();
    await Sentry.close(2_000);
    console.info("[bug-analysis-worker] graceful shutdown completed", { signal });
    process.exitCode = 0;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { area: "bullmq-worker", action: "shutdown" },
    });
    console.error("[bug-analysis-worker] graceful shutdown failed", { signal });
    process.exitCode = 1;
  }
}

process.once("SIGINT", () => {
  void shutdown("SIGINT");
});

process.once("SIGTERM", () => {
  void shutdown("SIGTERM");
});
