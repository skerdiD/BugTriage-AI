import { describe, expect, it } from "vitest";

import { getSafeAuthClientErrorMessage } from "@/lib/security/public-errors";

describe("public auth errors", () => {
  it.each([
    new TypeError("Failed to fetch (project.supabase.co)"),
    Object.assign(new Error("request failed"), {
      name: "AuthRetryableFetchError",
      status: 0,
    }),
    Object.assign(new Error("upstream unavailable"), { status: 503 }),
  ])("shows an availability message for network failures", (error) => {
    expect(getSafeAuthClientErrorMessage(error, "login")).toBe(
      "Authentication is temporarily unavailable. Please try again shortly."
    );
  });

  it("keeps invalid credentials distinct from service failures", () => {
    expect(
      getSafeAuthClientErrorMessage(
        new Error("Invalid login credentials"),
        "login"
      )
    ).toBe("Invalid email or password.");
  });
});
