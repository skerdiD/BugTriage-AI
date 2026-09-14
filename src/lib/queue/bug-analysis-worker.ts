import "server-only";

import { UnrecoverableError, type Job, type Processor } from "bullmq";

import {
  BUG_ANALYSIS_JOB_NAME,
  parseBugAnalysisJob,
  type BugAnalysisJobData,
} from "@/lib/queue/bug-analysis";
import {
  isRetryableTicketAnalysisError,
  processTicketAnalysis,
  recordTicketAnalysisFailure,
} from "@/lib/services/ticket-analysis";

type BugAnalysisProcessorDependencies = {
  process: typeof processTicketAnalysis;
  recordFailure: typeof recordTicketAnalysisFailure;
  isRetryable: typeof isRetryableTicketAnalysisError;
};

const defaultDependencies: BugAnalysisProcessorDependencies = {
  process: processTicketAnalysis,
  recordFailure: recordTicketAnalysisFailure,
  isRetryable: isRetryableTicketAnalysisError,
};

export function createBugAnalysisProcessor(
  dependencies: BugAnalysisProcessorDependencies = defaultDependencies
): Processor<BugAnalysisJobData> {
  return async (job: Job<BugAnalysisJobData>) => {
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
      const result = await dependencies.process({
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
      const retryable = dependencies.isRetryable(error);
      const maxAttempts = job.opts.attempts ?? 1;
      const willRetry = retryable && attempt < maxAttempts;

      await dependencies.recordFailure({
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
  };
}
