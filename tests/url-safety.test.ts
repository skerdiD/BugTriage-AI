import { describe, expect, it } from "vitest";

import { getSafeRedirectPath } from "@/lib/security/urls";

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
