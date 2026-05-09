import {
  AttachmentType,
  TicketSeverity,
  TicketStatus,
} from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  AuthenticationErrorMock,
  analyzeBugReportWithGeminiMock,
  createServerSupabaseClientMock,
  createTicketMock,
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
    createServerSupabaseClientMock: vi.fn(),
    createTicketMock: vi.fn(),
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

vi.mock("@/lib/security/arcjet", () => ({
  bugSubmissionProtection: {
    protect: protectMock,
  },
  getArcjetDeniedMessage: getArcjetDeniedMessageMock,
  logArcjetError: logArcjetErrorMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
}));

vi.mock("@/lib/supabase/storage", () => ({
  MAX_UPLOAD_FILES_PER_TYPE: 3,
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
    createServerSupabaseClientMock.mockResolvedValue({
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
    createTicketMock.mockResolvedValue({
      id: "ticket-1",
      code: "BUG-4242",
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
  });

  it("creates a ticket with AI-enriched fields when analysis succeeds", async () => {
    analyzeBugReportWithGeminiMock.mockResolvedValue(validAiResponse);

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
    expect(analyzeBugReportWithGeminiMock).toHaveBeenCalledWith(
      expect.objectContaining({
        attachmentNames: ["checkout.png", "console.log"],
        logText: expect.stringContaining("File: console.log"),
      })
    );
    expect(createTicketMock).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "BUG-4242",
        title: validAiResponse.improvedTitle,
        severity: TicketSeverity.CRITICAL,
        status: TicketStatus.NEW,
        category: "Payment",
        priorityScore: 96,
        aiConfidence: 94,
        aiAnalysis: expect.objectContaining({
          summary: validAiResponse.summary,
          confidenceScore: 94,
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
  });

  it("falls back to a manual ticket when AI analysis fails", async () => {
    analyzeBugReportWithGeminiMock.mockRejectedValue(
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
        category: "Manual Review",
        aiAnalysis: undefined,
      })
    );
  });

  it("uses a timeout-specific fallback message for slow AI calls", async () => {
    analyzeBugReportWithGeminiMock.mockRejectedValue(
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
});
