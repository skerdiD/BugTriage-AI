import { describe, expect, it, vi } from "vitest";

import { getRepublishInterval, runRepublisherLoop } from "@/lib/queue/republisher-loop";

describe("periodic outbox republisher", () => {
  it("bounds the interval and rejects invalid configuration", () => {
    expect(getRepublishInterval({ NODE_ENV: "test" })).toBe(15_000);
    for (const value of ["0", "999", "300001", "1.5", "invalid"]) {
      expect(() => getRepublishInterval({ NODE_ENV: "test", TICKET_ANALYSIS_REPUBLISH_INTERVAL_MS: value })).toThrow();
    }
  });

  it("finishes an active batch without overlap before stopping", async () => {
    const controller = new AbortController();
    let finish!: () => void;
    const run = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    const loop = runRepublisherLoop({ run, onError: vi.fn(), signal: controller.signal, intervalMs: 1_000 });

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(run).toHaveBeenCalledOnce();
    controller.abort();
    finish();
    await loop;
    expect(run).toHaveBeenCalledOnce();
  });

  it("recovers on the next interval after a failed batch and cancels idle sleep", async () => {
    const controller = new AbortController();
    const error = new Error("database temporarily unavailable");
    let secondBatch!: () => void;
    const reachedSecondBatch = new Promise<void>((resolve) => { secondBatch = resolve; });
    const run = vi.fn().mockRejectedValueOnce(error).mockImplementation(async () => { secondBatch(); });
    const onError = vi.fn();
    const loop = runRepublisherLoop({ run, onError, signal: controller.signal, intervalMs: 10 });

    await reachedSecondBatch;
    expect(onError).toHaveBeenCalledWith(error);
    expect(run).toHaveBeenCalledTimes(2);
    controller.abort();
    await loop;
    expect(run).toHaveBeenCalledTimes(2);
  });
});
