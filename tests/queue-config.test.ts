import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  BUG_ANALYSIS_ATTEMPTS,
  BUG_ANALYSIS_BACKOFF_DELAY_MS,
  buildBugAnalysisJob,
} from "@/lib/queue/bug-analysis";
import {
  RedisConfigurationError,
  getRedisUrl,
  getWorkerConcurrency,
  isRedisQueueEnabled,
} from "@/lib/queue/redis";

describe("Redis and BullMQ configuration", () => {
  function env(values: Record<string, string> = {}): NodeJS.ProcessEnv {
    return { NODE_ENV: "test", ...values };
  }

  it("reports queue publishing as disabled when REDIS_URL is absent", () => {
    const testEnv = env();

    expect(getRedisUrl(testEnv)).toBeNull();
    expect(isRedisQueueEnabled(testEnv)).toBe(false);
  });

  it("selects queue mode for redis and secure rediss URLs", () => {
    expect(
      isRedisQueueEnabled(env({ REDIS_URL: "redis://127.0.0.1:6379" }))
    ).toBe(true);
    expect(
      isRedisQueueEnabled(env({ REDIS_URL: "rediss://user:secret@redis.example.com" }))
    ).toBe(true);
  });

  it("rejects unsafe or malformed Redis configuration without exposing it", () => {
    expect(() =>
      getRedisUrl(env({ REDIS_URL: "https://secret.example.com" }))
    ).toThrow(RedisConfigurationError);
  });

  it("builds a minimal identifier-only payload with retry and backoff defaults", () => {
    const definition = buildBugAnalysisJob({
      ticketId: "ticket-1",
      jobId: "ticket-analysis-ticket-1-operation-1",
    });

    expect(definition.data).toEqual({ ticketId: "ticket-1" });
    expect(definition.options).toMatchObject({
      jobId: "ticket-analysis-ticket-1-operation-1",
      attempts: BUG_ANALYSIS_ATTEMPTS,
      backoff: {
        type: "exponential",
        delay: BUG_ANALYSIS_BACKOFF_DELAY_MS,
      },
    });
  });

  it("uses conservative bounded worker concurrency", () => {
    expect(getWorkerConcurrency(env())).toBe(3);
    expect(
      getWorkerConcurrency(env({ BULLMQ_WORKER_CONCURRENCY: "5" }))
    ).toBe(5);
    expect(() =>
      getWorkerConcurrency(env({ BULLMQ_WORKER_CONCURRENCY: "100" }))
    ).toThrow(RedisConfigurationError);
  });
});
