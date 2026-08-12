import "server-only";

import { randomUUID } from "node:crypto";

import { AiProcessingStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const TICKET_ANALYSIS_DISPATCH_PREFIX = "ticket-analysis-";

export function createTicketAnalysisDispatchIdentifiers() {
  const dispatchId = randomUUID();
  return { dispatchId, jobId: `${TICKET_ANALYSIS_DISPATCH_PREFIX}${dispatchId}` };
}

export async function prepareTicketAnalysisDispatch(input: {
  ticketId: string;
  requestedById?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const ticket = await tx.ticket.findUnique({
      where: { id: input.ticketId },
      select: { id: true, aiProcessingStatus: true, aiProcessingJobId: true },
    });

    if (!ticket) throw new Error("Ticket was not found.");

    if (
      ticket.aiProcessingJobId &&
      (ticket.aiProcessingStatus === AiProcessingStatus.PENDING ||
        ticket.aiProcessingStatus === AiProcessingStatus.PROCESSING)
    ) {
      const existing = await tx.ticketAnalysisDispatch.findUnique({
        where: { jobId: ticket.aiProcessingJobId },
        select: { id: true, jobId: true },
      });
      if (existing) return { ...existing, reused: true };

      const dispatchId = randomUUID();
      await tx.ticketAnalysisDispatch.create({
        data: { id: dispatchId, ticketId: ticket.id, jobId: ticket.aiProcessingJobId },
      });
      return { id: dispatchId, jobId: ticket.aiProcessingJobId, reused: true };
    }

    const identifiers = createTicketAnalysisDispatchIdentifiers();
    await tx.ticket.update({
      where: { id: ticket.id },
      data: {
        aiProcessingStatus: AiProcessingStatus.PENDING,
        aiProcessingJobId: identifiers.jobId,
        aiProcessingError: null,
        aiProcessingStartedAt: null,
        aiProcessingCompletedAt: null,
        aiProcessingRequestedById: input.requestedById ?? null,
      },
    });
    await tx.ticketAnalysisDispatch.create({
      data: { id: identifiers.dispatchId, ticketId: ticket.id, jobId: identifiers.jobId },
    });
    return { id: identifiers.dispatchId, jobId: identifiers.jobId, reused: false };
  });
}
