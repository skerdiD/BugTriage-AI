import { AiProcessingStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  analyzeMock,
  createEmbeddingMock,
  findSimilarMock,
  prismaMock,
} = vi.hoisted(() => ({
  analyzeMock: vi.fn(),
  createEmbeddingMock: vi.fn(),
  findSimilarMock: vi.fn(),
  prismaMock: {
    ticket: {
      updateMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    ticketAiAnalysisRun: {
      findUnique: vi.fn(),
    },
    ticketActivity: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/ai/bug-triage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/bug-triage")>();
  return { ...actual, analyzeBugReportWithGemini: analyzeMock };
});
vi.mock("@/lib/data/similar-issues", () => ({
  createAndStoreTicketEmbedding: createEmbeddingMock,
  findSimilarIssuesForTicket: findSimilarMock,
}));

import {
  TicketAnalysisPermanentError,
  isRetryableTicketAnalysisError,
  processTicketAnalysis,
  recordTicketAnalysisFailure,
} from "@/lib/services/ticket-analysis";

const output = {
  improvedTitle: "Checkout payment form fails on Safari iOS",
  summary:
    "Safari users cannot submit checkout because payment validation state remains stale.",
  severity: "HIGH" as const,
  category: "Payment",
  reproductionSteps: ["Open checkout on Safari and submit valid payment details."],
  likelyCause: "Safari validation events do not refresh the submit button state.",
  suggestedFix: "Normalize validation events and add Safari integration coverage.",
  priorityScore: 88,
  confidenceScore: 91,
  tags: ["payment", "safari"],
  developerTask: "Fix Safari payment validation state and add regression coverage.",
};

function ticketForAnalysis(storedOutput: typeof output | null = null) {
  return {
    id: "ticket-1",
    code: "BUG-4242",
    workspaceId: "workspace-1",
    projectId: "project-1",
    reporterId: "user-1",
    title: "Payment form fails on Safari mobile",
    description:
      "User cannot submit payment after entering valid card details on Safari mobile.",
    expectedBehavior: "Payment form should submit successfully.",
    actualBehavior: "Submit stays disabled after valid input.",
    stepsToReproduce: "1. Open checkout\n2. Enter card details\n3. Submit",
    browser: "safari",
    device: "ios-mobile",
    environment: "production",
    affectedPage: "/checkout",
    aiInputContext: { consoleLogs: "safe diagnostic" },
    aiProcessingRequestedById: "user-1",
    attachments: [{ filename: "console.log" }],
    aiAnalysisRuns: storedOutput ? [{ rawAiResponse: storedOutput }] : [],
    aiAnalysis: null,
  };
}

describe("ticket analysis processing service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.ticket.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.ticket.findFirst.mockResolvedValue(ticketForAnalysis());
    prismaMock.ticketAiAnalysisRun.findUnique.mockResolvedValue(null);
    prismaMock.ticket.update.mockResolvedValue({ id: "ticket-1" });
    prismaMock.ticketActivity.create.mockResolvedValue({ id: "activity-1" });
    prismaMock.$transaction.mockImplementation(
      async (callback: (tx: typeof prismaMock) => Promise<unknown>) => callback(prismaMock)
    );
    analyzeMock.mockResolvedValue(output);
    createEmbeddingMock.mockResolvedValue({ stored: true, contentHash: "hash-1" });
    findSimilarMock.mockResolvedValue([{ id: "ticket-2" }]);
  });

  it("transitions through processing, persists once, and keeps all writes workspace scoped", async () => {
    const result = await processTicketAnalysis({
      ticketId: "ticket-1",
      jobId: "analysis-job-1",
    });

    expect(analyzeMock).toHaveBeenCalledWith(expect.anything(), { maxRetries: 0 });
    expect(createEmbeddingMock).toHaveBeenCalledWith(
      expect.objectContaining({
        ticketId: "ticket-1",
        workspaceId: "workspace-1",
        projectId: "project-1",
      })
    );
    expect(findSimilarMock).toHaveBeenCalledWith({
      ticketId: "ticket-1",
      workspaceId: "workspace-1",
      projectId: "project-1",
    });
    expect(prismaMock.ticket.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "ticket-1",
          workspaceId: "workspace-1",
          projectId: "project-1",
          aiProcessingJobId: "analysis-job-1",
        }),
        data: expect.objectContaining({
          aiProcessingStatus: AiProcessingStatus.COMPLETED,
        }),
      })
    );
    expect(result).toEqual({ status: "completed", similarIssueCount: 1 });
  });

  it("reuses persisted output on an automatic retry instead of calling Gemini twice", async () => {
    prismaMock.ticket.findFirst.mockResolvedValue(ticketForAnalysis(output));

    await processTicketAnalysis({
      ticketId: "ticket-1",
      jobId: "analysis-job-1",
    });

    expect(analyzeMock).not.toHaveBeenCalled();
    expect(prismaMock.ticket.update).not.toHaveBeenCalled();
    expect(createEmbeddingMock).toHaveBeenCalledOnce();
  });

  it("records retry and terminal failure states against only the matching operation", async () => {
    await recordTicketAnalysisFailure({
      ticketId: "ticket-1",
      jobId: "analysis-job-1",
      error: new Error("temporary timeout"),
      willRetry: true,
    });
    await recordTicketAnalysisFailure({
      ticketId: "ticket-1",
      jobId: "analysis-job-1",
      error: new Error("permanent failure"),
      willRetry: false,
    });

    expect(prismaMock.ticket.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { id: "ticket-1", aiProcessingJobId: "analysis-job-1" },
        data: expect.objectContaining({ aiProcessingStatus: AiProcessingStatus.PENDING }),
      })
    );
    expect(prismaMock.ticket.updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { id: "ticket-1", aiProcessingJobId: "analysis-job-1" },
        data: expect.objectContaining({ aiProcessingStatus: AiProcessingStatus.FAILED }),
      })
    );
  });

  it("does not retry permanent validation or missing-resource failures", () => {
    expect(
      isRetryableTicketAnalysisError(
        new TicketAnalysisPermanentError("Ticket was not found.")
      )
    ).toBe(false);
    expect(isRetryableTicketAnalysisError(new Error("network reset"))).toBe(true);
  });
});
