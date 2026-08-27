import { describe, expect, it } from "vitest";

import {
  bugReportFormSchema,
  defaultBugReportValues,
  exampleBugReportValues,
} from "@/lib/validation/bug-report";

describe("bugReportFormSchema", () => {
  it("starts user-entered fields blank and keeps only the production default", () => {
    expect(defaultBugReportValues).toEqual({
      title: "",
      description: "",
      stepsToReproduce: "",
      expectedBehavior: "",
      actualBehavior: "",
      environment: "production",
      affectedPage: "",
      consoleLogs: "",
    });
  });

  it("accepts the optional example bug report values", () => {
    const result = bugReportFormSchema.safeParse(exampleBugReportValues);

    expect(result.success).toBe(true);
  });

  it("normalizes whitespace and newlines for user-provided text fields", () => {
    const result = bugReportFormSchema.safeParse({
      ...exampleBugReportValues,
      title: "   Payment   form fails on Safari mobile   ",
      description:
        "  User reported a checkout regression.  \r\n\r\n  Submit stays disabled after valid payment input. ",
      affectedPage: "   /checkout/payment   ",
    });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      title: "Payment form fails on Safari mobile",
      description:
        "User reported a checkout regression.\n\nSubmit stays disabled after valid payment input.",
      affectedPage: "/checkout/payment",
    });
  });

  it("rejects reports with an overly long console log payload", () => {
    const result = bugReportFormSchema.safeParse({
      ...exampleBugReportValues,
      consoleLogs: "x".repeat(8_001),
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Console logs must be 8,000 characters or fewer."
    );
  });

  it("rejects direct POSTs with unsupported select values", () => {
    const result = bugReportFormSchema.safeParse({
      ...exampleBugReportValues,
      browser: "opera",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Select a browser.");
  });
});
