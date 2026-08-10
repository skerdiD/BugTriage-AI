import "server-only";

import { enqueueBugAnalysis } from "@/lib/queue/bug-analysis";
import { getRedisUrl } from "@/lib/queue/redis";
import {
  prepareTicketAnalysis,
  processTicketAnalysis,
  recordTicketAnalysisFailure,
} from "@/lib/services/ticket-analysis";

type DispatchDependencies = {
  hasRedis: () => boolean;
  enqueue: typeof enqueueBugAnalysis;
  process: typeof processTicketAnalysis;
};

const defaultDependencies: DispatchDependencies = {
  hasRedis: () => getRedisUrl() !== null,
  enqueue: enqueueBugAnalysis,
  process: processTicketAnalysis,
};

export async function dispatchTicketAnalysis(
  input: { ticketId: string; requestedById?: string },
  dependencies: DispatchDependencies = defaultDependencies
) {
  const operation = await prepareTicketAnalysis(input);
  let redisEnabled = false;

  try {
    redisEnabled = dependencies.hasRedis();
  } catch {
    console.warn(
      "[ticket-analysis] Redis configuration is invalid; using synchronous fallback",
      { ticketId: input.ticketId, jobId: operation.jobId }
    );
  }

  if (redisEnabled) {
    try {
      const queued = await dependencies.enqueue({
        ticketId: input.ticketId,
        jobId: operation.jobId,
      });

      return { mode: "queued" as const, ...queued };
    } catch {
      console.warn("[ticket-analysis] enqueue failed; using synchronous fallback", {
        ticketId: input.ticketId,
        jobId: operation.jobId,
      });
    }
  }

  try {
    const result = await dependencies.process({
      ticketId: input.ticketId,
      jobId: operation.jobId,
    });

    return {
      mode: "synchronous" as const,
      jobId: operation.jobId,
      result,
    };
  } catch (error) {
    await recordTicketAnalysisFailure({
      ticketId: input.ticketId,
      jobId: operation.jobId,
      error,
      willRetry: false,
    });
    throw error;
  }
}
