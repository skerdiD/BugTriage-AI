import { beforeEach, describe, expect, it, vi } from "vitest";

const { enqueueMock, captureMock, prismaMock } = vi.hoisted(() => ({
  enqueueMock: vi.fn(),
  captureMock: vi.fn(),
  prismaMock: {
    ticketAnalysisDispatch: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/queue/bug-analysis", () => ({ enqueueBugAnalysis: enqueueMock }));
vi.mock("@/lib/observability/server-monitoring", () => ({ captureServerException: captureMock }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import {
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
});
