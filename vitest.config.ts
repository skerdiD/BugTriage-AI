import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    exclude: ["tests/e2e/**"],
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/setup/env.ts"],
  },
});
