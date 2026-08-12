import { beforeEach, describe, expect, it, vi } from "vitest";

const { prepareMock, dispatchMock } = vi.hoisted(() => ({
  prepareMock: vi.fn(),
  dispatchMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/services/ticket-analysis", () => ({
  prepareTicketAnalysis: prepareMock,
}));
vi.mock("@/lib/queue/republish-ticket-analysis", () => ({
  dispatchTicketAnalysisOutboxRecord: dispatchMock,
}));

import { dispatchTicketAnalysis } from "@/lib/queue/dispatch-ticket-analysis";

describe("ticket analysis dispatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prepareMock.mockResolvedValue({ jobId: "analysis-job-1", reused: false });
    dispatchMock.mockResolvedValue({
      mode: "queued",
      jobId: "analysis-job-1",
      queueName: "bug-analysis",
    });
  });

  it("publishes the durable request without running AI in the HTTP request", async () => {
    const result = await dispatchTicketAnalysis({
      ticketId: "ticket-1",
      requestedById: "user-1",
    });

    expect(prepareMock).toHaveBeenCalledWith({
      ticketId: "ticket-1",
      requestedById: "user-1",
    });
    expect(dispatchMock).toHaveBeenCalledWith({
      ticketId: "ticket-1",
      jobId: "analysis-job-1",
    });
    expect(result.mode).toBe("queued");
  });

  it("returns pending when Redis publishing is unavailable", async () => {
    dispatchMock.mockResolvedValue({ mode: "pending", jobId: "analysis-job-1" });

    const result = await dispatchTicketAnalysis({ ticketId: "ticket-1" });

    expect(result).toEqual({ mode: "pending", jobId: "analysis-job-1" });
    expect(dispatchMock).toHaveBeenCalledOnce();
  });
});
