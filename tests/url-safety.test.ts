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
});
