import { describe, expect, it } from "vitest";

import { bugTriageAiOutputSchema } from "@/lib/ai/bug-triage-schema";

describe("bugTriageAiOutputSchema", () => {
  it("accepts a valid AI bug triage response", () => {
    const result = bugTriageAiOutputSchema.safeParse({
      improvedTitle: "Checkout payment form fails on Safari iOS",
      summary:
        "Users on Safari iOS cannot complete checkout because the payment form remains disabled after valid card details are entered.",
      severity: "CRITICAL",
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
    });

    expect(result.success).toBe(true);
  });

  it("normalizes AI text fields, reproduction steps, and tags", () => {
    const result = bugTriageAiOutputSchema.safeParse({
      improvedTitle: "  Checkout payment form fails on Safari iOS  ",
      summary:
        "  Users on Safari iOS cannot complete checkout.\n\nThe payment form remains disabled after valid card details are entered.  ",
      severity: "HIGH",
      category: "  Payment Bugs  ",
      reproductionSteps: [
        "1. Open checkout on Safari iOS.",
        "  2. Enter valid card details.  ",
        "Observe that submit remains disabled.",
      ],
      likelyCause:
        "  Safari-specific validation events may not update the payment form submit state correctly. ",
      suggestedFix:
        "  Audit payment form state handling, add defensive checks, and test Safari iOS card validation events. ",
      priorityScore: 90,
      confidenceScore: 83,
      tags: [" Payment ", "safari_ios", "payment"],
      developerTask:
        "  Investigate Safari iOS payment form validation and fix submit state handling. ",
    });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      improvedTitle: "Checkout payment form fails on Safari iOS",
      category: "Payment Bugs",
      reproductionSteps: [
        "Open checkout on Safari iOS.",
        "Enter valid card details.",
        "Observe that submit remains disabled.",
      ],
      tags: ["payment", "safari-ios"],
    });
  });

  it("rejects invalid severity and score values", () => {
    const result = bugTriageAiOutputSchema.safeParse({
      improvedTitle: "Bad bug",
      summary: "Too short.",
      severity: "URGENT",
      category: "Payment",
      reproductionSteps: [],
      likelyCause: "Unknown",
      suggestedFix: "Fix it",
      priorityScore: 120,
      confidenceScore: -1,
      tags: [],
      developerTask: "Fix",
    });

    expect(result.success).toBe(false);
  });
});
