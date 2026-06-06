import { describe, expect, it } from "vitest";

import {
  DEFAULT_DEMO_USER_EMAIL,
  DEMO_TICKET_CODE_PREFIX,
  buildDemoTickets,
  getObsoleteDemoTicketCodes,
} from "../prisma/seed";
import { DEMO_USER_EMAIL } from "@/lib/demo";

describe("demo seed helpers", () => {
  it("uses the documented shared demo account", () => {
    expect(DEFAULT_DEMO_USER_EMAIL).toBe(DEMO_USER_EMAIL);
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
