import { describe, expect, it } from "vitest";

import { ticketCodeSchema } from "@/lib/validation/resource-identifiers";

describe("resource identifier validation", () => {
  it("accepts production and seeded demo ticket codes", () => {
    expect(ticketCodeSchema.safeParse("BUG-4242").success).toBe(true);
    expect(ticketCodeSchema.safeParse("DEMO-1008").success).toBe(true);
  });

  it("rejects malformed ticket codes", () => {
    expect(ticketCodeSchema.safeParse("bad-ticket").success).toBe(false);
    expect(ticketCodeSchema.safeParse("DEMO-abc").success).toBe(false);
  });
});
