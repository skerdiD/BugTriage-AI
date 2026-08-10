import "server-only";

import { Queue, type JobsOptions } from "bullmq";
import { z } from "zod";

import { createRedisConnection } from "@/lib/queue/redis";

export const BUG_ANALYSIS_QUEUE_NAME = "bug-analysis";
export const BUG_ANALYSIS_JOB_NAME = "analyze-ticket";
export const BUG_ANALYSIS_ATTEMPTS = 3;
export const BUG_ANALYSIS_BACKOFF_DELAY_MS = 2_000;

export const bugAnalysisJobDataSchema = z.object({
  ticketId: z.string().trim().min(1).max(191),
});

export type BugAnalysisJobData = z.infer<typeof bugAnalysisJobDataSchema>;

export type BugAnalysisJobDefinition = {
  name: typeof BUG_ANALYSIS_JOB_NAME;
  data: BugAnalysisJobData;
  options: JobsOptions;
};

const globalForQueue = globalThis as unknown as {
  bugAnalysisQueue?: Queue<BugAnalysisJobData>;
};

export function buildBugAnalysisJob(input: {
  ticketId: string;
  jobId: string;
}): BugAnalysisJobDefinition {
  const data = bugAnalysisJobDataSchema.parse({ ticketId: input.ticketId });

  if (!input.jobId.trim() || input.jobId.includes(":")) {
    throw new Error("BullMQ analysis job IDs must be non-empty and cannot contain colons.");
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
    globalForQueue.bugAnalysisQueue = new Queue<BugAnalysisJobData>(
      BUG_ANALYSIS_QUEUE_NAME,
      {
        connection: createRedisConnection("producer"),
      }
    );
  }

  return globalForQueue.bugAnalysisQueue;
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
