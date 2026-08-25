import { describe, expect, it } from "vitest";

import { getAuthPageHref, getSafeRedirectPath } from "@/lib/security/urls";

describe("getSafeRedirectPath", () => {
  it("keeps safe in-app redirects", () => {
    expect(getSafeRedirectPath("/tickets/BUG-1001?tab=activity")).toBe(
      "/tickets/BUG-1001?tab=activity"
    );
  });

  it("rejects absolute and protocol-relative redirects", () => {
    expect(getSafeRedirectPath("https://evil.example")).toBe("/dashboard");
    expect(getSafeRedirectPath("//evil.example")).toBe("/dashboard");
    expect(getSafeRedirectPath("\\\\evil.example")).toBe("/dashboard");
  });

  it("rejects control characters that URL parsers can normalize into another origin", () => {
    expect(getSafeRedirectPath("/\n//evil.example")).toBe("/dashboard");
    expect(getSafeRedirectPath("/\r//evil.example")).toBe("/dashboard");
    expect(getSafeRedirectPath("/\t//evil.example")).toBe("/dashboard");
  });
});

describe("getAuthPageHref", () => {
  it("preserves a safe invite return path when switching auth pages", () => {
    expect(getAuthPageHref("/login", "/invite/invite_token_1234567890")).toBe(
      "/login?redirectedFrom=%2Finvite%2Finvite_token_1234567890"
    );
  });

  it("preserves query state in a protected return path", () => {
    expect(getAuthPageHref("/signup", "/tickets?status=NEW&severity=HIGH")).toBe(
      "/signup?redirectedFrom=%2Ftickets%3Fstatus%3DNEW%26severity%3DHIGH"
    );
  });

  it("falls back safely when the return path is external", () => {
    expect(getAuthPageHref("/login", "https://evil.example")).toBe(
      "/login?redirectedFrom=%2Fdashboard"
    );
  });
});
