import {
  AttachmentType,
  TicketSeverity,
  TicketStatus,
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  AuthenticationErrorMock,
  analyzeBugReportWithGeminiMock,
  createSupabaseAdminClientMock,
  createAndStoreTicketEmbeddingMock,
  createTicketMock,
  dispatchTicketAnalysisMock,
  generateUniqueTicketCodeMock,
  getArcjetDeniedMessageMock,
  getArcjetRequestMock,
  getPublicAiTriageFailureMessageMock,
  getCurrentWorkspaceContextOrThrowMock,
  deleteUploadedTicketFilesMock,
  logArcjetErrorMock,
  protectMock,
  uploadLogFileMock,
  uploadScreenshotFileMock,
} = vi.hoisted(() => {
  class AuthenticationErrorMock extends Error {}

  return {
    AuthenticationErrorMock,
    analyzeBugReportWithGeminiMock: vi.fn(),
    createAndStoreTicketEmbeddingMock: vi.fn(),
    createSupabaseAdminClientMock: vi.fn(),
    createTicketMock: vi.fn(),
    dispatchTicketAnalysisMock: vi.fn(),
    generateUniqueTicketCodeMock: vi.fn(),
    getArcjetDeniedMessageMock: vi.fn(),
    getArcjetRequestMock: vi.fn(),
    getPublicAiTriageFailureMessageMock: vi.fn(),
    getCurrentWorkspaceContextOrThrowMock: vi.fn(),
    deleteUploadedTicketFilesMock: vi.fn(),
    logArcjetErrorMock: vi.fn(),
    protectMock: vi.fn(),
    uploadLogFileMock: vi.fn(),
    uploadScreenshotFileMock: vi.fn(),
  };
});

vi.mock("server-only", () => ({}));

vi.mock("@arcjet/next", () => ({
  request: getArcjetRequestMock,
}));

vi.mock("@sentry/nextjs", () => ({
  addBreadcrumb: vi.fn(),
  captureException: vi.fn(),
  startSpan: vi.fn((_context, callback) => callback()),
  metrics: {
    count: vi.fn(),
  },
}));

vi.mock("@/lib/auth/session", () => ({
  AuthenticationError: AuthenticationErrorMock,
  getCurrentWorkspaceContextOrThrow: getCurrentWorkspaceContextOrThrowMock,
}));

vi.mock("@/lib/ai/bug-triage", () => ({
  AI_TRIAGE_MAX_LOG_BYTES_PER_FILE: 8_000,
  analyzeBugReportWithGemini: analyzeBugReportWithGeminiMock,
  getPublicAiTriageFailureMessage: getPublicAiTriageFailureMessageMock,
}));

vi.mock("@/lib/data/tickets", () => ({
  createTicket: createTicketMock,
  generateUniqueTicketCode: generateUniqueTicketCodeMock,
}));

vi.mock("@/lib/data/similar-issues", () => ({
  createAndStoreTicketEmbedding: createAndStoreTicketEmbeddingMock,
}));

vi.mock("@/lib/queue/dispatch-ticket-analysis", () => ({
  dispatchTicketAnalysis: dispatchTicketAnalysisMock,
}));

vi.mock("@/lib/security/arcjet", () => ({
  bugSubmissionProtection: {
    protect: protectMock,
  },
  getArcjetDeniedMessage: getArcjetDeniedMessageMock,
  logArcjetError: logArcjetErrorMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock,
}));

vi.mock("@/lib/supabase/storage", () => ({
  MAX_UPLOAD_FILES_PER_TYPE: 3,
  MAX_TOTAL_TICKET_UPLOAD_BYTES: 20 * 1024 * 1024,
  deleteUploadedTicketFiles: deleteUploadedTicketFilesMock,
  uploadLogFile: uploadLogFileMock,
  uploadScreenshotFile: uploadScreenshotFileMock,
}));

import { analyzeAndCreateTicketAction } from "@/app/(dashboard)/submit-bug/actions";
import { defaultBugReportValues } from "@/lib/validation/bug-report";

const validAiResponse = {
  improvedTitle: "Checkout payment form fails on Safari iOS",
  summary:
    "Users on Safari iOS cannot complete checkout because the payment form remains disabled after valid card details are entered.",
  severity: "CRITICAL" as const,
  category: "Payment",
  reproductionSteps: [
    "Open checkout on Safari iOS.",
    "Enter valid card details.",
    "Observe that submit remains disabled.",
  ],
  likelyCause:
    "Safari-specific validation events may not update the payment form submit state correctly.",
  suggestedFix:
    "Audit payment form state handling, add defensive checks, and test Safari iOS card validation events.",
  priorityScore: 96,
  confidenceScore: 94,
  tags: ["payment", "checkout", "safari-ios"],
  developerTask:
    "Investigate Safari iOS payment form validation and fix submit state handling.",
};

function createAllowedDecision() {
  return {
    isDenied: () => false,
    isErrored: () => false,
    reason: {
      message: "Allowed.",
      isRateLimit: () => false,
      isBot: () => false,
      isShield: () => false,
    },
  };
}

function buildValidFormData() {
  const formData = new FormData();

  Object.entries(defaultBugReportValues).forEach(([key, value]) => {
    formData.append(key, value);
  });

  return formData;
}

describe("analyzeAndCreateTicketAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getCurrentWorkspaceContextOrThrowMock.mockResolvedValue({
      user: { id: "user-1" },
      workspace: { id: "workspace-1" },
      project: { id: "project-1" },
    });
    createSupabaseAdminClientMock.mockReturnValue({
      storage: {},
    });
    getArcjetRequestMock.mockResolvedValue({
      headers: new Headers(),
    });
    protectMock.mockResolvedValue(createAllowedDecision());
    generateUniqueTicketCodeMock.mockResolvedValue("BUG-4242");
    getPublicAiTriageFailureMessageMock.mockImplementation((error: unknown) => {
      const message =
        error instanceof Error ? error.message.toLowerCase() : "unknown error";

      if (message.includes("google_generative_ai_api_key")) {
        return "AI analysis is temporarily unavailable, so the ticket was saved for manual review.";
      }

      if (message.includes("timeout") || message.includes("timed out")) {
        return "AI analysis timed out, so the ticket was saved for manual review.";
      }

      return "AI analysis is temporarily unavailable, so the ticket was saved for manual review.";
    });
    uploadScreenshotFileMock.mockResolvedValue({
      bucket: "bugtriage-private",
      fileName: "checkout.png",
      fileType: "image/png",
      fileSize: 512,
      storagePath:
        "private/workspace-1/user-1/tickets/BUG-4242/screenshots/checkout.png",
      attachmentType: "SCREENSHOT",
    });
    uploadLogFileMock.mockResolvedValue({
      bucket: "bugtriage-private",
      fileName: "console.log",
      fileType: "text/plain",
      fileSize: 128,
      storagePath:
        "private/workspace-1/user-1/tickets/BUG-4242/logs/console.log",
      attachmentType: "LOG",
    });
    deleteUploadedTicketFilesMock.mockResolvedValue(undefined);
    createAndStoreTicketEmbeddingMock.mockResolvedValue({
      stored: true,
      contentHash: "hash-1",
    });
    createTicketMock.mockResolvedValue({
      id: "ticket-1",
      code: "BUG-4242",
    });
    dispatchTicketAnalysisMock.mockResolvedValue({
      mode: "synchronous",
      jobId: "ticket-analysis-ticket-1-test",
      result: { status: "completed", similarIssueCount: 0 },
    });
  });

  it("returns the first validation error before making external calls", async () => {
    const formData = buildValidFormData();
    formData.set("title", "Bad");

    const result = await analyzeAndCreateTicketAction(formData);

    expect(result).toEqual({
      ok: false,
      error: "Bug title must be at least 5 characters.",
    });
    expect(getCurrentWorkspaceContextOrThrowMock).not.toHaveBeenCalled();
  });

  it("rejects uploads that exceed the per-type file limit", async () => {
    const formData = buildValidFormData();

    for (let index = 0; index < 4; index += 1) {
      formData.append(
        "logs",
        new File([`line ${index}`], `log-${index}.log`, {
          type: "text/plain",
        })
      );
    }

    const result = await analyzeAndCreateTicketAction(formData);

    expect(result).toEqual({
      ok: false,
      error: "You can upload up to 3 log files per ticket.",
    });
    expect(uploadLogFileMock).not.toHaveBeenCalled();
    expect(createSupabaseAdminClientMock).not.toHaveBeenCalled();
  });

  it("rejects uploads whose combined payload exceeds the safe ticket limit", async () => {
    const formData = buildValidFormData();

    formData.append(
      "screenshots",
      new File([new Uint8Array(10 * 1024 * 1024)], "shot-1.png", {
        type: "image/png",
      })
    );
    formData.append(
      "logs",
      new File([new Uint8Array(10 * 1024 * 1024 + 1)], "trace.log", {
        type: "text/plain",
      })
    );

    const result = await analyzeAndCreateTicketAction(formData);

    expect(result).toEqual({
      ok: false,
      error: "Combined uploads must be 20MB or smaller per ticket.",
    });
    expect(uploadScreenshotFileMock).not.toHaveBeenCalled();
    expect(uploadLogFileMock).not.toHaveBeenCalled();
    expect(createSupabaseAdminClientMock).not.toHaveBeenCalled();
  });

  it("returns a safe upload validation error when storage rejects an unsupported file", async () => {
    uploadScreenshotFileMock.mockRejectedValue(
      Object.assign(new Error("invalid screenshot content"), {
        name: "TicketStorageError",
        userMessage: "Screenshot content did not match a valid PNG, JPG, JPEG, or WEBP file.",
      })
    );

    const formData = buildValidFormData();
    formData.append(
      "screenshots",
      new File(["not-an-image"], "checkout.png", { type: "image/png" })
    );

    const result = await analyzeAndCreateTicketAction(formData);

    expect(result).toEqual({
      ok: false,
      error:
        "Screenshot content did not match a valid PNG, JPG, JPEG, or WEBP file.",
    });
    expect(createTicketMock).not.toHaveBeenCalled();
  });

  it("does not create a Supabase admin storage client when no files are attached", async () => {
    analyzeBugReportWithGeminiMock.mockResolvedValue(validAiResponse);

    const result = await analyzeAndCreateTicketAction(buildValidFormData());

    expect(result).toMatchObject({
      ok: true,
      ticketCode: "BUG-4242",
    });
    expect(createSupabaseAdminClientMock).not.toHaveBeenCalled();
    expect(uploadScreenshotFileMock).not.toHaveBeenCalled();
    expect(uploadLogFileMock).not.toHaveBeenCalled();
  });

  it("creates the ticket before dispatching its AI processing operation", async () => {

    const formData = buildValidFormData();
    formData.append(
      "screenshots",
      new File(["image"], "checkout.png", { type: "image/png" })
    );
    formData.append(
      "logs",
      new File(["console stack trace"], "console.log", { type: "text/plain" })
    );

    const result = await analyzeAndCreateTicketAction(formData);

    expect(result).toMatchObject({
      ok: true,
      ticketCode: "BUG-4242",
      aiFailed: false,
    });
    expect(result).not.toHaveProperty("uploadedFiles");
    expect(createTicketMock).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "BUG-4242",
        title: defaultBugReportValues.title,
        severity: TicketSeverity.MEDIUM,
        status: TicketStatus.NEW,
        category: "Pending AI triage",
        aiInputContext: expect.objectContaining({
          uploadedLogText: expect.stringContaining("File: console.log"),
        }),
        attachments: [
          expect.objectContaining({
            filename: "checkout.png",
            attachmentType: AttachmentType.SCREENSHOT,
          }),
          expect.objectContaining({
            filename: "console.log",
            attachmentType: AttachmentType.LOG,
          }),
        ],
      })
    );
    expect(dispatchTicketAnalysisMock).toHaveBeenCalledWith({
      ticketId: "ticket-1",
      requestedById: "user-1",
    });
    expect(analyzeBugReportWithGeminiMock).not.toHaveBeenCalled();
  });

  it("falls back to a manual ticket when AI analysis fails", async () => {
    dispatchTicketAnalysisMock.mockRejectedValue(
      new Error("GOOGLE_GENERATIVE_AI_API_KEY is missing")
    );

    const result = await analyzeAndCreateTicketAction(buildValidFormData());

    expect(result).toMatchObject({
      ok: true,
      ticketCode: "BUG-4242",
      aiFailed: true,
    });
    if (!result.ok) {
      throw new Error("Expected the action to succeed with a manual fallback.");
    }
    expect(result.warning).toBe(
      "Ticket was created, but AI analysis is temporarily unavailable, so the ticket was saved for manual review."
    );
    expect(createTicketMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: defaultBugReportValues.title,
        severity: TicketSeverity.MEDIUM,
        category: "Pending AI triage",
      })
    );
  });

  it("returns immediately when Redis mode queues the analysis", async () => {
    dispatchTicketAnalysisMock.mockResolvedValue({
      mode: "queued",
      jobId: "ticket-analysis-ticket-1-test",
      queueName: "bug-analysis",
    });

    const result = await analyzeAndCreateTicketAction(buildValidFormData());

    expect(result).toMatchObject({
      ok: true,
      ticketCode: "BUG-4242",
      aiFailed: false,
    });
    expect(createTicketMock).toHaveBeenCalled();
    expect(dispatchTicketAnalysisMock).toHaveBeenCalledOnce();
    expect(createAndStoreTicketEmbeddingMock).not.toHaveBeenCalled();
  });

  it("uses a timeout-specific fallback message for slow AI calls", async () => {
    dispatchTicketAnalysisMock.mockRejectedValue(
      new Error("Request timed out after 12000ms")
    );

    const result = await analyzeAndCreateTicketAction(buildValidFormData());

    expect(result).toMatchObject({
      ok: true,
      ticketCode: "BUG-4242",
      aiFailed: true,
    });
    if (!result.ok) {
      throw new Error("Expected the action to succeed with a manual fallback.");
    }
    expect(result.warning).toBe(
      "Ticket was created, but AI analysis timed out, so the ticket was saved for manual review."
    );
  });

  it("cleans up uploaded files if the database write fails after upload", async () => {
    const formData = buildValidFormData();
    formData.append(
      "screenshots",
      new File(["image"], "checkout.png", { type: "image/png" })
    );
    createTicketMock.mockRejectedValue(new Error("database unavailable"));

    const result = await analyzeAndCreateTicketAction(formData);

    expect(result).toEqual({
      ok: false,
      error: "We couldn't create the ticket right now. Please try again.",
    });
    expect(deleteUploadedTicketFilesMock).toHaveBeenCalledWith(
      expect.anything(),
      [
        expect.objectContaining({
          storagePath:
            "private/workspace-1/user-1/tickets/BUG-4242/screenshots/checkout.png",
        }),
      ]
    );
  });

  it("cleans up earlier uploads when a later attachment upload fails", async () => {
    uploadLogFileMock.mockRejectedValue(
      Object.assign(new Error("storage unavailable"), {
        name: "TicketStorageError",
        userMessage: "We couldn't upload one of the selected files. Please try again.",
      })
    );

    const formData = buildValidFormData();
    formData.append(
      "screenshots",
      new File(["image"], "checkout.png", { type: "image/png" })
    );
    formData.append(
      "logs",
      new File(["console stack trace"], "console.log", { type: "text/plain" })
    );

    const result = await analyzeAndCreateTicketAction(formData);

    expect(result).toEqual({
      ok: false,
      error: "We couldn't upload one of the selected files. Please try again.",
    });
    expect(createTicketMock).not.toHaveBeenCalled();
    expect(deleteUploadedTicketFilesMock).toHaveBeenCalledWith(
      expect.anything(),
      [
        expect.objectContaining({
          storagePath:
            "private/workspace-1/user-1/tickets/BUG-4242/screenshots/checkout.png",
        }),
      ]
    );
  });
});
