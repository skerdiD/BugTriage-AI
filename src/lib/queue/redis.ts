import "server-only";

import Redis, { type RedisOptions } from "ioredis";

const SUPPORTED_REDIS_PROTOCOLS = new Set(["redis:", "rediss:"]);
const DEFAULT_WORKER_CONCURRENCY = 3;
const MAX_WORKER_CONCURRENCY = 20;

export class RedisConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RedisConfigurationError";
  }
}

export function getRedisUrl(env: NodeJS.ProcessEnv = process.env) {
  const value = env.REDIS_URL?.trim();

  if (!value) {
    return null;
  }

  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new RedisConfigurationError(
      "REDIS_URL must be a valid redis:// or rediss:// URL."
    );
  }

  if (!SUPPORTED_REDIS_PROTOCOLS.has(parsed.protocol) || !parsed.hostname) {
    throw new RedisConfigurationError(
      "REDIS_URL must be a valid redis:// or rediss:// URL."
    );
  }

  return value;
}

export function isRedisQueueEnabled(env: NodeJS.ProcessEnv = process.env) {
  return getRedisUrl(env) !== null;
}

export function getWorkerConcurrency(env: NodeJS.ProcessEnv = process.env) {
  const value = env.BULLMQ_WORKER_CONCURRENCY?.trim();

  if (!value) {
    return DEFAULT_WORKER_CONCURRENCY;
  }

  const concurrency = Number(value);

  if (
    !Number.isInteger(concurrency) ||
    concurrency < 1 ||
    concurrency > MAX_WORKER_CONCURRENCY
  ) {
    throw new RedisConfigurationError(
      `BULLMQ_WORKER_CONCURRENCY must be an integer between 1 and ${MAX_WORKER_CONCURRENCY}.`
    );
  }

  return concurrency;
}

export function createRedisConnection(role: "producer" | "worker") {
  const redisUrl = getRedisUrl();

  if (!redisUrl) {
    throw new RedisConfigurationError(
      "REDIS_URL is required to create a BullMQ connection."
    );
  }

  const options: RedisOptions = {
    connectionName: `bugtriage-${role}`,
    connectTimeout: 5_000,
    maxRetriesPerRequest: role === "worker" ? null : 1,
  };

  return new Redis(redisUrl, options);
}
