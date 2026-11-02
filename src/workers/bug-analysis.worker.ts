import * as Sentry from "@sentry/nextjs";
import { Worker } from "bullmq";

import "@/sentry.server.config";

import {
  BUG_ANALYSIS_QUEUE_NAME,
  type BugAnalysisJobData,
} from "@/lib/queue/bug-analysis";
import { createBugAnalysisProcessor } from "@/lib/queue/bug-analysis-worker";
import {
  createRedisConnection,
  getWorkerConcurrency,
} from "@/lib/queue/redis";
import { prisma } from "@/lib/prisma";

const concurrency = getWorkerConcurrency();
const redis = createRedisConnection("worker");
const worker = new Worker<BugAnalysisJobData>(
  BUG_ANALYSIS_QUEUE_NAME,
  createBugAnalysisProcessor(),
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

  // The worker's commands retry indefinitely while Redis is offline. Release
  // those pending commands before waiting for BullMQ's main loop to drain.
  if (!["ready", "end"].includes(redis.status)) redis.disconnect();

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
    redis.status === "ready" ? redis.quit() : Promise.resolve(redis.disconnect()),
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
