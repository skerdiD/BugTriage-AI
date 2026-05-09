import { describe, expect, it } from "vitest";

import {
  DEFAULT_DEMO_USER_EMAIL,
  DEMO_TICKET_CODE_PREFIX,
  buildDemoTickets,
  getObsoleteDemoTicketCodes,
  resolveDemoSeedUserEmail,
} from "../prisma/seed";

describe("demo seed helpers", () => {
  it("uses SEED_DEMO_USER_EMAIL when it is configured", () => {
    const result = resolveDemoSeedUserEmail({
      SEED_DEMO_USER_EMAIL: "  PortfolioUser@Example.com  ",
    });

    expect(result).toBe("portfoliouser@example.com");
  });

  it("falls back to the documented demo seed account when no env override is set", () => {
    const result = resolveDemoSeedUserEmail({});

    expect(result).toBe(DEFAULT_DEMO_USER_EMAIL);
  });

  it("builds a stable set of managed demo tickets without duplicate codes", () => {
    const tickets = buildDemoTickets();
    const codes = tickets.map((ticket) => ticket.code);

    expect(tickets.length).toBeGreaterThan(0);
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.every((code) => code.startsWith(DEMO_TICKET_CODE_PREFIX))).toBe(
      true
    );
  });

  it("only flags stale managed demo ticket codes for cleanup on rerun", () => {
    const obsolete = getObsoleteDemoTicketCodes(
      ["DEMO-1001", "DEMO-1008", "DEMO-9999"],
      ["DEMO-1001", "DEMO-1008", "DEMO-1010"]
    );

    expect(obsolete).toEqual(["DEMO-9999"]);
  });
});
