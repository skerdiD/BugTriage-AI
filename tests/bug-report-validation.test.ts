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
});
