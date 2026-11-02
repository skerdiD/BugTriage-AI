import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { redis, closeWorker, disconnectDatabase, closeSentry, captureException } = vi.hoisted(() => ({
  redis: { status: "ready", disconnect: vi.fn(), quit: vi.fn() },
  closeWorker: vi.fn(),
  disconnectDatabase: vi.fn(),
  closeSentry: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({ close: closeSentry, captureException }));
vi.mock("@/sentry.server.config", () => ({}));
vi.mock("bullmq", () => ({ Worker: class { close = closeWorker; on = vi.fn(); } }));
vi.mock("@/lib/queue/bug-analysis", () => ({ BUG_ANALYSIS_QUEUE_NAME: "bug-analysis" }));
vi.mock("@/lib/queue/bug-analysis-worker", () => ({ createBugAnalysisProcessor: vi.fn() }));
vi.mock("@/lib/queue/redis", () => ({ createRedisConnection: () => redis, getWorkerConcurrency: () => 3 }));
vi.mock("@/lib/prisma", () => ({ prisma: { $disconnect: disconnectDatabase } }));

const existingSignals = {
  SIGINT: new Set(process.listeners("SIGINT")),
  SIGTERM: new Set(process.listeners("SIGTERM")),
};
const originalExitCode = process.exitCode;

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  closeWorker.mockResolvedValue(undefined);
  disconnectDatabase.mockResolvedValue(undefined);
  closeSentry.mockResolvedValue(true);
  redis.disconnect.mockImplementation(() => { redis.status = "end"; });
  redis.quit.mockImplementation(async () => { redis.status = "end"; return "OK"; });
});

afterEach(() => {
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    for (const listener of process.listeners(signal)) {
      if (!existingSignals[signal].has(listener)) process.removeListener(signal, listener);
    }
  }
  process.exitCode = originalExitCode;
});

describe("standalone worker shutdown", () => {
  it.each(["ready", "reconnecting"])("drains and exits cleanly with Redis %s", async (status) => {
    redis.status = status;
    await import("@/workers/bug-analysis.worker");
    const handler = process.listeners("SIGTERM").find((listener) => !existingSignals.SIGTERM.has(listener));
    expect(handler).toBeDefined();
    handler!("SIGTERM");
    await vi.waitFor(() => expect(closeSentry).toHaveBeenCalledOnce());

    expect(closeWorker).toHaveBeenCalledOnce();
    expect(disconnectDatabase).toHaveBeenCalledOnce();
    expect(captureException).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(0);
    if (status === "reconnecting") {
      expect(redis.disconnect.mock.invocationCallOrder[0]).toBeLessThan(closeWorker.mock.invocationCallOrder[0]);
      expect(redis.quit).not.toHaveBeenCalled();
    } else {
      expect(closeWorker.mock.invocationCallOrder[0]).toBeLessThan(redis.quit.mock.invocationCallOrder[0]);
    }
  });
});
