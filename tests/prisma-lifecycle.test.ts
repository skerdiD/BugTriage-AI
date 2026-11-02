import { afterEach, describe, expect, it, vi } from "vitest";

const { construct, disconnect, query } = vi.hoisted(() => ({
  construct: vi.fn(),
  disconnect: vi.fn(),
  query: vi.fn(),
}));
vi.mock("@prisma/adapter-pg", () => ({ PrismaPg: class {} }));
vi.mock("@prisma/client", () => ({
  PrismaClient: class {
    ticket = { findMany: query };
    constructor() { construct(); }
    $on() {}
    $disconnect() { disconnect(this); }
  },
}));
vi.mock("@/lib/observability/server-monitoring", () => ({ captureServerException: vi.fn() }));

afterEach(() => {
  delete (globalThis as { prisma?: unknown }).prisma;
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  vi.resetModules();
});

describe("production Prisma lifecycle", () => {
  it("reuses one pool for model queries and disconnects that same client", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const { prisma } = await import("@/lib/prisma");
    await prisma.ticket.findMany();
    await prisma.ticket.findMany();
    await prisma.$disconnect();
    expect(query).toHaveBeenCalledTimes(2);
    expect(construct).toHaveBeenCalledOnce();
    expect(disconnect).toHaveBeenCalledWith((globalThis as { prisma?: unknown }).prisma);
  });
});
