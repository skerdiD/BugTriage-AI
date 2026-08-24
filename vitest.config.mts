import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDirectory = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(rootDirectory, "./src"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    exclude: ["tests/e2e/**", "tests/**/*.integration.test.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/setup/env.ts"],
  },
});
