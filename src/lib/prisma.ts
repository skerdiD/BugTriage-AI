import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { captureServerException } from "@/lib/observability/server-monitoring";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }

  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl, connectionTimeoutMillis: 5_000 }),
    log:
      process.env.NODE_ENV === "development"
        ? ["query", { emit: "event", level: "error" }, "warn"]
        : [{ emit: "event", level: "error" }],
  });

  client.$on("error", (event) => {
    captureServerException(new Error(event.message), {
      area: "database",
      action: "prisma-client",
      message: "[database] prisma client error",
      context: {
        target: event.target,
      },
    });
  });

  return client;
}

function getPrismaClient() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const client = createPrismaClient();

  // Every process owns one pool, including production workers and CLI scripts.
  // Cleanup must disconnect the same client that executed the queries.
  globalForPrisma.prisma = client;

  return client;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
