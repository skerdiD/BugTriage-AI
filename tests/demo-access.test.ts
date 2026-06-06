import { describe, expect, it } from "vitest";

import {
  DEMO_READ_ONLY_MESSAGE,
  DEMO_USER_EMAIL,
  DEMO_USER_PASSWORD,
  isDemoTicketCode,
  isDemoUser,
} from "@/lib/demo";

describe("demo access helpers", () => {
  it("recognizes the shared demo identity case-insensitively", () => {
    expect(isDemoUser({ email: `  ${DEMO_USER_EMAIL.toUpperCase()}  ` })).toBe(
      true
    );
    expect(isDemoUser({ email: "engineer@example.com" })).toBe(false);
    expect(isDemoUser({ email: null })).toBe(false);
  });

  it("keeps the documented credentials and read-only message available", () => {
    expect(DEMO_USER_PASSWORD).toBe("Demo1234!");
    expect(DEMO_READ_ONLY_MESSAGE).toContain("read-only");
  });

  it("recognizes seeded demo ticket codes", () => {
    expect(isDemoTicketCode("DEMO-1008")).toBe(true);
    expect(isDemoTicketCode(" demo-1008 ")).toBe(true);
    expect(isDemoTicketCode("BUG-1008")).toBe(false);
  });
});
