import { DelayedError, UnrecoverableError, type Job } from "bullmq";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { createBugAnalysisProcessor } from "@/lib/queue/bug-analysis-worker";
import type { BugAnalysisJobData } from "@/lib/queue/bug-analysis";

function makeJob() {
  return {
    name: "analyze-ticket", id: "analysis-job-1", data: { ticketId: "ticket-1" },
    attemptsMade: 0, opts: { attempts: 3 }, moveToDelayed: vi.fn().mockResolvedValue(undefined),
  };
}

describe("BullMQ analysis recovery", () => {
  it("defers a stalled delivery while its database processing lease is still active", async () => {
    const job = makeJob();
    const recordFailure = vi.fn();
    const processor = createBugAnalysisProcessor({
      process: vi.fn().mockResolvedValue({ status: "processing", similarIssueCount: 0 }),
      recordFailure, isRetryable: vi.fn(),
    });
    const before = Date.now();
    await expect(processor(job as unknown as Job<BugAnalysisJobData>, "lock-token")).rejects.toBeInstanceOf(DelayedError);
    expect(job.moveToDelayed.mock.calls[0][0]).toBeGreaterThanOrEqual(before + 60_000);
    expect(job.moveToDelayed.mock.calls[0][1]).toBe("lock-token");
    expect(recordFailure).not.toHaveBeenCalled();
  });

  it.each([true, false])("records retryable=%s failures with the appropriate BullMQ outcome", async (retryable) => {
    const job = makeJob();
    const error = new Error("provider unavailable");
    const recordFailure = vi.fn().mockResolvedValue(undefined);
    const processor = createBugAnalysisProcessor({
      process: vi.fn().mockRejectedValue(error), recordFailure,
      isRetryable: () => retryable,
    });
    await expect(processor(job as unknown as Job<BugAnalysisJobData>)).rejects.toBeInstanceOf(retryable ? Error : UnrecoverableError);
    expect(recordFailure).toHaveBeenCalledWith({ ticketId: "ticket-1", jobId: "analysis-job-1", error, willRetry: retryable });
  });
});
