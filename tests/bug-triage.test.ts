import { beforeEach, describe, expect, it, vi } from "vitest";

const { generateObjectMock, googleMock } = vi.hoisted(() => ({
  generateObjectMock: vi.fn(),
  googleMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("ai", () => ({
  generateObject: generateObjectMock,
}));

vi.mock("@ai-sdk/google", () => ({
  google: googleMock,
}));

import {
  analyzeBugReportWithGemini,
  BUG_TRIAGE_SYSTEM_PROMPT,
} from "@/lib/ai/bug-triage";
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

describe("analyzeBugReportWithGemini", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-key";

    googleMock.mockReturnValue("mock-gemini-model");
    generateObjectMock.mockResolvedValue({
      object: validAiResponse,
    });
  });

  it("requires a Gemini API key before attempting analysis", async () => {
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    await expect(
      analyzeBugReportWithGemini({
        report: defaultBugReportValues,
      })
    ).rejects.toThrow("Missing GOOGLE_GENERATIVE_AI_API_KEY.");

    expect(generateObjectMock).not.toHaveBeenCalled();
  });

  it("redacts secrets and keeps truncated inputs valid before calling the model", async () => {
    const logPayload = `Authorization: Bearer abcdef1234567890TOKEN0987654321
DATABASE_URL=postgresql://user:pass@db.example.com:5432/app
${"trace-line ".repeat(3_000)}`;

    const result = await analyzeBugReportWithGemini({
      report: {
        ...defaultBugReportValues,
        consoleLogs: logPayload,
      },
      logText: `password=super-secret-password\n${"fatal error ".repeat(3_000)}`,
      attachmentNames: ["   production    checkout    log.txt   "],
    });

    expect(result).toEqual(validAiResponse);
    expect(googleMock).toHaveBeenCalledWith("gemini-2.0-flash-001");
    expect(generateObjectMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "mock-gemini-model",
        system: BUG_TRIAGE_SYSTEM_PROMPT,
        temperature: 0.2,
      })
    );

    const [{ prompt }] = generateObjectMock.mock.calls[0];

    expect(prompt).toContain("Bearer [REDACTED]");
    expect(prompt).toContain("[REDACTED_DATABASE_URL]");
    expect(prompt).toContain("password=[REDACTED]");
    expect(prompt).toContain("[TRUNCATED]");
    expect(prompt).toContain("production checkout log.txt");
    expect(prompt).not.toContain("super-secret-password");
    expect(prompt).not.toContain("postgresql://user:pass@db.example.com:5432/app");
  });
});
