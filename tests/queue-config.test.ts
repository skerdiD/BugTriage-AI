import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  BUG_ANALYSIS_ATTEMPTS,
  BUG_ANALYSIS_BACKOFF_DELAY_MS,
  buildBugAnalysisJob,
  parseBugAnalysisJob,
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

  it("rejects plaintext remote Redis connections in production", () => {
    expect(() =>
      getRedisUrl({
        NODE_ENV: "production",
        REDIS_URL: "redis://default:secret@redis.example.com:6379",
      })
    ).toThrow("Production Redis connections must use TLS");

    expect(
      getRedisUrl({
        NODE_ENV: "production",
        REDIS_URL: "rediss://default:secret@redis.example.com:6379",
      })
    ).toBe("rediss://default:secret@redis.example.com:6379");
    expect(
      getRedisUrl({
        NODE_ENV: "production",
        REDIS_URL: "redis://127.0.0.1:6379",
      })
    ).toBe("redis://127.0.0.1:6379");
    expect(
      getRedisUrl({
        NODE_ENV: "production",
        REDIS_URL: "redis://redis:6379",
        REDIS_ALLOW_INSECURE_CONNECTION: "true",
      })
    ).toBe("redis://redis:6379");
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

  it("rejects malformed or unexpected worker jobs without accepting extra data", () => {
    expect(
      parseBugAnalysisJob({
        name: "analyze-ticket",
        data: { ticketId: " ticket-1 " },
        jobId: "analysis-job-1",
      })
    ).toEqual({ data: { ticketId: "ticket-1" }, jobId: "analysis-job-1" });

    expect(() =>
      parseBugAnalysisJob({
        name: "unexpected-job",
        data: { ticketId: "ticket-1" },
        jobId: "analysis-job-1",
      })
    ).toThrow("unexpected name");
    expect(() =>
      parseBugAnalysisJob({
        name: "analyze-ticket",
        data: { ticketId: "ticket-1", report: "untrusted payload" },
        jobId: "analysis-job-1",
      })
    ).toThrow();
  });

  it("uses conservative bounded worker concurrency", () => {
    expect(getWorkerConcurrency(env())).toBe(3);
    expect(
      getWorkerConcurrency(env({ BULLMQ_WORKER_CONCURRENCY: "5" }))
    ).toBe(5);

    for (const invalidValue of ["0", "-1", "1.5", "abc", "21", "100"]) {
      expect(() =>
        getWorkerConcurrency(
          env({ BULLMQ_WORKER_CONCURRENCY: invalidValue })
        )
      ).toThrow(RedisConfigurationError);
    }
  });
});
