import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  enqueueMock,
  prepareMock,
  processMock,
  recordFailureMock,
} = vi.hoisted(() => ({
  enqueueMock: vi.fn(),
  prepareMock: vi.fn(),
  processMock: vi.fn(),
  recordFailureMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/queue/bug-analysis", () => ({
  enqueueBugAnalysis: enqueueMock,
}));
vi.mock("@/lib/services/ticket-analysis", () => ({
  prepareTicketAnalysis: prepareMock,
  processTicketAnalysis: processMock,
  recordTicketAnalysisFailure: recordFailureMock,
}));

import { dispatchTicketAnalysis } from "@/lib/queue/dispatch-ticket-analysis";

describe("ticket analysis dispatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prepareMock.mockResolvedValue({ jobId: "analysis-job-1", reused: false });
    enqueueMock.mockResolvedValue({
      jobId: "analysis-job-1",
      queueName: "bug-analysis",
    });
    processMock.mockResolvedValue({ status: "completed", similarIssueCount: 1 });
  });

  it("uses the synchronous processing service when Redis is absent", async () => {
    const result = await dispatchTicketAnalysis(
      { ticketId: "ticket-1", requestedById: "user-1" },
      { hasRedis: () => false, enqueue: enqueueMock, process: processMock }
    );

    expect(enqueueMock).not.toHaveBeenCalled();
    expect(processMock).toHaveBeenCalledWith({
      ticketId: "ticket-1",
      jobId: "analysis-job-1",
    });
    expect(result.mode).toBe("synchronous");
  });

  it("enqueues without running AI in the request when Redis is configured", async () => {
    const result = await dispatchTicketAnalysis(
      { ticketId: "ticket-1" },
      { hasRedis: () => true, enqueue: enqueueMock, process: processMock }
    );

    expect(enqueueMock).toHaveBeenCalledWith({
      ticketId: "ticket-1",
      jobId: "analysis-job-1",
    });
    expect(processMock).not.toHaveBeenCalled();
    expect(result.mode).toBe("queued");
  });

  it("does not lose work when Redis publishing fails", async () => {
    enqueueMock.mockRejectedValue(new Error("redis unavailable"));

    const result = await dispatchTicketAnalysis(
      { ticketId: "ticket-1" },
      { hasRedis: () => true, enqueue: enqueueMock, process: processMock }
    );

    expect(processMock).toHaveBeenCalledOnce();
    expect(result.mode).toBe("synchronous");
  });

  it("marks a terminal synchronous failure without deleting the ticket", async () => {
    const failure = new Error("provider unavailable");
    processMock.mockRejectedValue(failure);

    await expect(
      dispatchTicketAnalysis(
        { ticketId: "ticket-1" },
        { hasRedis: () => false, enqueue: enqueueMock, process: processMock }
      )
    ).rejects.toThrow("provider unavailable");

    expect(recordFailureMock).toHaveBeenCalledWith({
      ticketId: "ticket-1",
      jobId: "analysis-job-1",
      error: failure,
      willRetry: false,
    });
  });
});
