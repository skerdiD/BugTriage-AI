import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";

import { defineConfig } from "prisma/config";

const inheritedEnvironmentVariables = new Set(Object.keys(process.env));

for (const envFile of [".env", ".env.local"]) {
  if (!existsSync(envFile)) continue;

  for (const [name, value] of Object.entries(
    parseEnv(readFileSync(envFile, "utf8"))
  )) {
    if (!inheritedEnvironmentVariables.has(name)) {
      process.env[name] = value;
    }
  }
}

function getPrismaDatasourceUrl() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "Prisma requires DIRECT_URL or DATABASE_URL to generate the client."
    );
  }

  return url;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: getPrismaDatasourceUrl(),
  },
});
