import "server-only";

import { randomUUID } from "node:crypto";

import {
  AiProcessingStatus,
  TicketAnalysisDispatchStatus,
} from "@prisma/client";

import { enqueueBugAnalysis } from "@/lib/queue/bug-analysis";
import { captureServerException } from "@/lib/observability/server-monitoring";
import { prisma } from "@/lib/prisma";
import { getSafeErrorMessage } from "@/lib/security/redaction";

const CLAIM_LEASE_MS = 60_000;
const MAX_DISPATCH_ATTEMPTS = 8;
const MAX_DISPATCH_ERROR_LENGTH = 500;
const MAX_DISPATCH_BACKOFF_MS = 15 * 60_000;
export const TICKET_ANALYSIS_REPUBLISH_CONCURRENCY = 5;
export const TICKET_ANALYSIS_REPUBLISH_MAX_LIMIT = 500;
const TERMINAL_TICKET_ERROR =
  "Background analysis could not be scheduled. Retry the analysis later.";

type RepublishDependencies = { enqueue: typeof enqueueBugAnalysis; now: () => Date };
const defaultDependencies: RepublishDependencies = {
  enqueue: enqueueBugAnalysis,
  now: () => new Date(),
};

export function getDispatchBackoffMs(attempt: number) {
  return Math.min(1_000 * 2 ** Math.max(0, attempt - 1), MAX_DISPATCH_BACKOFF_MS);
}

function normalizeRepublishLimit(limit?: number) {
  if (limit === undefined || !Number.isFinite(limit)) return 100;

  return Math.min(
    Math.max(Math.trunc(limit), 1),
    TICKET_ANALYSIS_REPUBLISH_MAX_LIMIT
  );
}

async function claimDispatch(dispatchId: string, now: Date) {
  const claimToken = randomUUID();
  const staleBefore = new Date(now.getTime() - CLAIM_LEASE_MS);
  const claimed = await prisma.ticketAnalysisDispatch.updateMany({
    where: {
      id: dispatchId,
      OR: [
        { status: TicketAnalysisDispatchStatus.PENDING, nextAttemptAt: { lte: now } },
        { status: TicketAnalysisDispatchStatus.DISPATCHING, lockedAt: { lt: staleBefore } },
      ],
    },
    data: {
      status: TicketAnalysisDispatchStatus.DISPATCHING,
      lockedAt: now,
      claimToken,
      attempts: { increment: 1 },
    },
  });
  return claimed.count === 1 ? claimToken : null;
}

async function dispatchClaimedRecord(input: {
  id: string;
  ticketId: string;
  jobId: string;
  attempts: number;
  claimToken: string;
  now: Date;
  dependencies: RepublishDependencies;
}) {
  const attempt = input.attempts + 1;
  try {
    const queued = await input.dependencies.enqueue({ ticketId: input.ticketId, jobId: input.jobId });
    await prisma.ticketAnalysisDispatch.updateMany({
      where: { id: input.id, status: TicketAnalysisDispatchStatus.DISPATCHING, claimToken: input.claimToken },
      data: {
        status: TicketAnalysisDispatchStatus.DISPATCHED,
        dispatchedAt: input.now,
        lockedAt: null,
        claimToken: null,
        lastError: null,
      },
    });
    console.info("[ticket-analysis-dispatch] published", {
      dispatchId: input.id, ticketId: input.ticketId, jobId: input.jobId, attempt, queueName: queued.queueName,
    });
    return { mode: "queued" as const, jobId: input.jobId, queueName: queued.queueName };
  } catch (error) {
    const safeError = getSafeErrorMessage(error).slice(0, MAX_DISPATCH_ERROR_LENGTH);
    const terminal = attempt >= MAX_DISPATCH_ATTEMPTS;
    const dispatchWhere = {
      id: input.id,
      status: TicketAnalysisDispatchStatus.DISPATCHING,
      claimToken: input.claimToken,
    };
    const dispatchData = {
      status: terminal
        ? TicketAnalysisDispatchStatus.FAILED
        : TicketAnalysisDispatchStatus.PENDING,
      nextAttemptAt: new Date(
        input.now.getTime() + getDispatchBackoffMs(attempt)
      ),
      lastError: safeError,
      lockedAt: null,
      claimToken: null,
    };

    if (terminal) {
      await prisma.$transaction(async (tx) => {
        const finalized = await tx.ticketAnalysisDispatch.updateMany({
          where: dispatchWhere,
          data: dispatchData,
        });

        if (finalized.count !== 1) return;

        await tx.ticket.updateMany({
          where: {
            id: input.ticketId,
            aiProcessingJobId: input.jobId,
            aiProcessingStatus: AiProcessingStatus.PENDING,
          },
          data: {
            aiProcessingStatus: AiProcessingStatus.FAILED,
            aiProcessingError: TERMINAL_TICKET_ERROR,
            aiProcessingStartedAt: null,
            aiProcessingCompletedAt: null,
          },
        });
      });
    } else {
      await prisma.ticketAnalysisDispatch.updateMany({
        where: dispatchWhere,
        data: dispatchData,
      });
    }
    captureServerException(error, {
      area: "ticket-analysis-dispatch",
      action: "enqueue",
      level: terminal ? "error" : "warning",
      message: "[ticket-analysis-dispatch] BullMQ publish failed",
      context: { dispatchId: input.id, ticketId: input.ticketId, jobId: input.jobId, attempt },
    });
    console.warn("[ticket-analysis-dispatch] publish deferred", {
      dispatchId: input.id, ticketId: input.ticketId, jobId: input.jobId, attempt, terminal,
    });
    return { mode: "pending" as const, jobId: input.jobId };
  }
}

export async function dispatchTicketAnalysisOutboxRecord(
  input: { ticketId: string; jobId: string },
  dependencies: RepublishDependencies = defaultDependencies
) {
  const now = dependencies.now();
  const dispatch = await prisma.ticketAnalysisDispatch.findUnique({
    where: { jobId: input.jobId },
    select: { id: true, ticketId: true, jobId: true, attempts: true },
  });
  if (!dispatch || dispatch.ticketId !== input.ticketId) return { mode: "pending" as const, jobId: input.jobId };

  const claimToken = await claimDispatch(dispatch.id, now);
  if (!claimToken) return { mode: "pending" as const, jobId: input.jobId };
  return dispatchClaimedRecord({ ...dispatch, claimToken, now, dependencies });
}

export async function republishPendingTicketAnalyses(
  input: { limit?: number } = {},
  dependencies: RepublishDependencies = defaultDependencies
) {
  const now = dependencies.now();
  const staleBefore = new Date(now.getTime() - CLAIM_LEASE_MS);
  const pending = await prisma.ticketAnalysisDispatch.findMany({
    where: {
      OR: [
        { status: TicketAnalysisDispatchStatus.PENDING, nextAttemptAt: { lte: now } },
        { status: TicketAnalysisDispatchStatus.DISPATCHING, lockedAt: { lt: staleBefore } },
      ],
    },
    orderBy: { nextAttemptAt: "asc" },
    take: normalizeRepublishLimit(input.limit),
    select: { id: true, ticketId: true, jobId: true, attempts: true },
  });
  let queued = 0;
  let deferred = 0;

  for (
    let offset = 0;
    offset < pending.length;
    offset += TICKET_ANALYSIS_REPUBLISH_CONCURRENCY
  ) {
    const batch = pending.slice(
      offset,
      offset + TICKET_ANALYSIS_REPUBLISH_CONCURRENCY
    );
    const results = await Promise.all(
      batch.map(async (dispatch) => {
        const claimToken = await claimDispatch(dispatch.id, now);
        if (!claimToken) return null;

        return dispatchClaimedRecord({
          ...dispatch,
          claimToken,
          now,
          dependencies,
        });
      })
    );

    for (const result of results) {
      if (result?.mode === "queued") queued += 1;
      else if (result?.mode === "pending") deferred += 1;
    }
  }
  console.info("[ticket-analysis-republisher] completed", { candidates: pending.length, queued, deferred });
  return { candidates: pending.length, queued, deferred };
}
