import "server-only";

import { Queue, type JobsOptions } from "bullmq";
import { z } from "zod";

import { captureServerException } from "@/lib/observability/server-monitoring";
import { createRedisConnection } from "@/lib/queue/redis";

export const BUG_ANALYSIS_QUEUE_NAME = "bug-analysis";
export const BUG_ANALYSIS_JOB_NAME = "analyze-ticket";
export const BUG_ANALYSIS_ATTEMPTS = 3;
export const BUG_ANALYSIS_BACKOFF_DELAY_MS = 2_000;

export const bugAnalysisJobDataSchema = z.object({
  ticketId: z.string().trim().min(1).max(191),
}).strict();

export type BugAnalysisJobData = z.infer<typeof bugAnalysisJobDataSchema>;

export type BugAnalysisJobDefinition = {
  name: typeof BUG_ANALYSIS_JOB_NAME;
  data: BugAnalysisJobData;
  options: JobsOptions;
};

export function parseBugAnalysisJob(input: {
  name: string;
  data: unknown;
  jobId?: string;
}) {
  if (input.name !== BUG_ANALYSIS_JOB_NAME) {
    throw new Error("BullMQ analysis job has an unexpected name.");
  }

  const data = bugAnalysisJobDataSchema.parse(input.data);
  const jobId = input.jobId?.trim();

  if (!jobId || jobId.length > 191 || jobId.includes(":")) {
    throw new Error(
      "BullMQ analysis job IDs must be non-empty, at most 191 characters, and cannot contain colons."
    );
  }

  return { data, jobId };
}

const globalForQueue = globalThis as unknown as {
  bugAnalysisQueue?: Queue<BugAnalysisJobData>;
  bugAnalysisQueueConnection?: ReturnType<typeof createRedisConnection>;
};

export function buildBugAnalysisJob(input: {
  ticketId: string;
  jobId: string;
}): BugAnalysisJobDefinition {
  const data = bugAnalysisJobDataSchema.parse({ ticketId: input.ticketId });

  if (
    !input.jobId.trim() ||
    input.jobId.length > 191 ||
    input.jobId.includes(":")
  ) {
    throw new Error(
      "BullMQ analysis job IDs must be non-empty, at most 191 characters, and cannot contain colons."
    );
  }

  return {
    name: BUG_ANALYSIS_JOB_NAME,
    data,
    options: {
      jobId: input.jobId,
      attempts: BUG_ANALYSIS_ATTEMPTS,
      backoff: {
        type: "exponential",
        delay: BUG_ANALYSIS_BACKOFF_DELAY_MS,
      },
      removeOnComplete: { age: 24 * 60 * 60, count: 1_000 },
      removeOnFail: { age: 7 * 24 * 60 * 60, count: 5_000 },
    },
  };
}

export function getBugAnalysisQueue() {
  if (!globalForQueue.bugAnalysisQueue) {
    const connection = createRedisConnection("producer");
    const queue = new Queue<BugAnalysisJobData>(
      BUG_ANALYSIS_QUEUE_NAME,
      {
        connection,
      }
    );

    queue.on("error", (error) => {
      captureServerException(error, {
        area: "bullmq-producer",
        action: "queue-error",
        level: "warning",
        message: "[bug-analysis-queue] producer connection error",
        context: { queue: BUG_ANALYSIS_QUEUE_NAME },
      });
    });

    globalForQueue.bugAnalysisQueue = queue;
    globalForQueue.bugAnalysisQueueConnection = connection;
  }

  return globalForQueue.bugAnalysisQueue;
}

export async function closeBugAnalysisQueue() {
  const queue = globalForQueue.bugAnalysisQueue;
  const connection = globalForQueue.bugAnalysisQueueConnection;

  globalForQueue.bugAnalysisQueue = undefined;
  globalForQueue.bugAnalysisQueueConnection = undefined;

  const errors: unknown[] = [];

  if (queue) {
    try {
      await queue.close();
    } catch (error) {
      errors.push(error);
    }
  }

  if (connection && connection.status !== "end") {
    try {
      await connection.quit();
    } catch (error) {
      connection.disconnect();
      errors.push(error);
    }
  }

  if (errors.length > 0) {
    throw new AggregateError(errors, "Failed to close the BullMQ producer cleanly.");
  }
}

export async function enqueueBugAnalysis(input: {
  ticketId: string;
  jobId: string;
}) {
  const definition = buildBugAnalysisJob(input);
  const job = await getBugAnalysisQueue().add(
    definition.name,
    definition.data,
    definition.options
  );

  return {
    jobId: job.id ?? input.jobId,
    queueName: BUG_ANALYSIS_QUEUE_NAME,
  };
}
