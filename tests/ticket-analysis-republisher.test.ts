import {
  AiProcessingStatus,
  TicketAnalysisDispatchStatus,
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { enqueueMock, captureMock, prismaMock } = vi.hoisted(() => ({
  enqueueMock: vi.fn(),
  captureMock: vi.fn(),
  prismaMock: {
    ticket: {
      updateMany: vi.fn(),
    },
    ticketAnalysisDispatch: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/queue/bug-analysis", () => ({ enqueueBugAnalysis: enqueueMock }));
vi.mock("@/lib/observability/server-monitoring", () => ({ captureServerException: captureMock }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import {
  TICKET_ANALYSIS_REPUBLISH_CONCURRENCY,
  dispatchTicketAnalysisOutboxRecord,
  republishPendingTicketAnalyses,
} from "@/lib/queue/republish-ticket-analysis";

const now = new Date("2026-08-12T10:00:00.000Z");
const record = { id: "dispatch-1", ticketId: "ticket-1", jobId: "analysis-job-1", attempts: 0 };
const dependencies = { enqueue: enqueueMock, now: () => now };

describe("ticket analysis outbox republisher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enqueueMock.mockResolvedValue({ jobId: "analysis-job-1", queueName: "bug-analysis" });
    prismaMock.ticketAnalysisDispatch.findUnique.mockResolvedValue(record);
    prismaMock.ticketAnalysisDispatch.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.ticket.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.$transaction.mockImplementation(
      async (callback: (tx: typeof prismaMock) => Promise<unknown>) =>
        callback(prismaMock)
    );
  });

  it("marks a durable record dispatched after Redis accepts its stable job", async () => {
    const result = await dispatchTicketAnalysisOutboxRecord(
      { ticketId: "ticket-1", jobId: "analysis-job-1" },
      dependencies
    );

    expect(result.mode).toBe("queued");
    expect(enqueueMock).toHaveBeenCalledWith({ ticketId: "ticket-1", jobId: "analysis-job-1" });
    expect(prismaMock.ticketAnalysisDispatch.updateMany).toHaveBeenCalledTimes(2);
  });

  it("keeps the record pending and does not execute AI when Redis is unavailable", async () => {
    enqueueMock.mockRejectedValue(new Error("redis unavailable"));

    const result = await dispatchTicketAnalysisOutboxRecord(
      { ticketId: "ticket-1", jobId: "analysis-job-1" },
      dependencies
    );

    expect(result).toEqual({ mode: "pending", jobId: "analysis-job-1" });
    expect(captureMock).toHaveBeenCalledOnce();
    expect(prismaMock.ticketAnalysisDispatch.updateMany).toHaveBeenCalledTimes(2);
  });

  it("publishes a previously pending record after Redis recovers", async () => {
    prismaMock.ticketAnalysisDispatch.findMany.mockResolvedValue([record]);

    await expect(republishPendingTicketAnalyses({}, dependencies)).resolves.toEqual({
      candidates: 1,
      queued: 1,
      deferred: 0,
    });
    expect(enqueueMock).toHaveBeenCalledOnce();
  });

  it("publishes backlog records concurrently without exceeding the safe bound", async () => {
    const records = Array.from(
      { length: TICKET_ANALYSIS_REPUBLISH_CONCURRENCY + 2 },
      (_, index) => ({
        id: `dispatch-${index}`,
        ticketId: `ticket-${index}`,
        jobId: `analysis-job-${index}`,
        attempts: 0,
      })
    );
    let active = 0;
    let peakActive = 0;

    prismaMock.ticketAnalysisDispatch.findMany.mockResolvedValue(records);
    enqueueMock.mockImplementation(async ({ jobId }: { jobId: string }) => {
      active += 1;
      peakActive = Math.max(peakActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return { jobId, queueName: "bug-analysis" };
    });

    await expect(republishPendingTicketAnalyses({}, dependencies)).resolves.toEqual({
      candidates: records.length,
      queued: records.length,
      deferred: 0,
    });
    expect(peakActive).toBeGreaterThan(1);
    expect(peakActive).toBeLessThanOrEqual(
      TICKET_ANALYSIS_REPUBLISH_CONCURRENCY
    );
  });

  it("does not publish twice when another republisher owns the claim", async () => {
    prismaMock.ticketAnalysisDispatch.findMany.mockResolvedValue([record]);
    prismaMock.ticketAnalysisDispatch.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    await republishPendingTicketAnalyses({}, dependencies);
    await republishPendingTicketAnalyses({}, dependencies);

    expect(enqueueMock).toHaveBeenCalledOnce();
  });

  it("marks the ticket retryable after bounded dispatch attempts are exhausted", async () => {
    prismaMock.ticketAnalysisDispatch.findUnique.mockResolvedValue({
      ...record,
      attempts: 7,
    });
    enqueueMock.mockRejectedValue(new Error("redis unavailable"));

    await expect(
      dispatchTicketAnalysisOutboxRecord(
        { ticketId: "ticket-1", jobId: "analysis-job-1" },
        dependencies
      )
    ).resolves.toEqual({ mode: "pending", jobId: "analysis-job-1" });

    expect(prismaMock.$transaction).toHaveBeenCalledOnce();
    expect(prismaMock.ticketAnalysisDispatch.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: TicketAnalysisDispatchStatus.FAILED,
          lastError: expect.stringContaining("redis unavailable"),
        }),
      })
    );
    expect(prismaMock.ticket.updateMany).toHaveBeenCalledWith({
      where: {
        id: "ticket-1",
        aiProcessingJobId: "analysis-job-1",
        aiProcessingStatus: AiProcessingStatus.PENDING,
      },
      data: {
        aiProcessingStatus: AiProcessingStatus.FAILED,
        aiProcessingError:
          "Background analysis could not be scheduled. Retry the analysis later.",
        aiProcessingStartedAt: null,
        aiProcessingCompletedAt: null,
      },
    });
  });

  it("does not overwrite ticket state after an expired claim is lost", async () => {
    prismaMock.ticketAnalysisDispatch.findUnique.mockResolvedValue({
      ...record,
      attempts: 7,
    });
    prismaMock.ticketAnalysisDispatch.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });
    enqueueMock.mockRejectedValue(new Error("redis unavailable"));

    await dispatchTicketAnalysisOutboxRecord(
      { ticketId: "ticket-1", jobId: "analysis-job-1" },
      dependencies
    );

    expect(prismaMock.ticket.updateMany).not.toHaveBeenCalled();
  });
});
