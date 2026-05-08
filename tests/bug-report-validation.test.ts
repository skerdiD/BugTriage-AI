import { describe, expect, it } from "vitest";

import {
  bugReportFormSchema,
  defaultBugReportValues,
} from "@/lib/validation/bug-report";

describe("bugReportFormSchema", () => {
  it("accepts the default demo bug report values", () => {
    const result = bugReportFormSchema.safeParse(defaultBugReportValues);

    expect(result.success).toBe(true);
  });

  it("normalizes whitespace and newlines for user-provided text fields", () => {
    const result = bugReportFormSchema.safeParse({
      ...defaultBugReportValues,
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
      ...defaultBugReportValues,
      consoleLogs: "x".repeat(8_001),
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Console logs must be less than 8000 characters."
    );
  });

  it("rejects direct POSTs with unsupported select values", () => {
    const result = bugReportFormSchema.safeParse({
      ...defaultBugReportValues,
      browser: "opera",
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Select a browser.");
  });
});
