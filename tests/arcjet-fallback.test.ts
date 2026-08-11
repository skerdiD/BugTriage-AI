import { beforeAll, describe, expect, it, vi } from "vitest";

type Protection = typeof import("@/lib/security/arcjet");

let protection: Protection;

beforeAll(async () => {
  vi.stubEnv("ARCJET_KEY", "");
  vi.resetModules();
  protection = await import("@/lib/security/arcjet");
});

describe("local request-protection fallback", () => {
  it("keeps GitHub export and bug submission limits independent", async () => {
    const request = new Request("http://localhost/api/test");
    const details = { userId: "rate-limit-user" };

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const decision = await protection.githubIssueExportProtection.protect(
        request,
        details
      );
      expect(decision.isDenied()).toBe(false);
    }

    const githubDenied = await protection.githubIssueExportProtection.protect(
      request,
      details
    );
    const firstBugSubmission = await protection.bugSubmissionProtection.protect(
      request,
      details
    );

    expect(githubDenied.isDenied()).toBe(true);
    expect(firstBugSubmission.isDenied()).toBe(false);
  });
});
