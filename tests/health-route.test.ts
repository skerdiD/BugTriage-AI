import { describe, expect, it, vi } from "vitest";

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { $queryRaw: query } }));
import { GET } from "@/app/api/health/route";

describe("container readiness", () => {
  it("checks the database and disables caching", async () => {
    query.mockResolvedValueOnce([{ result: 1 }]);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(query).toHaveBeenCalled();
  });

  it("returns 503 without exposing connection errors", async () => {
    query.mockRejectedValueOnce(new Error("password=secret"));
    const response = await GET();
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ status: "unavailable" });
  });
});
