import { beforeEach, describe, expect, it, vi } from "vitest";

const { headersMock } = vi.hoisted(() => ({
  headersMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

import { getAppBaseUrl } from "@/lib/security/app-url";

function restoreEnvValue(key: string, value: string | undefined) {
  if (typeof value === "undefined") {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}

describe("getAppBaseUrl", () => {
  const originalEnv = {
    APP_URL: process.env.APP_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
    VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    NODE_ENV: process.env.NODE_ENV,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    restoreEnvValue("APP_URL", originalEnv.APP_URL);
    restoreEnvValue("NEXT_PUBLIC_APP_URL", originalEnv.NEXT_PUBLIC_APP_URL);
    restoreEnvValue(
      "VERCEL_PROJECT_PRODUCTION_URL",
      originalEnv.VERCEL_PROJECT_PRODUCTION_URL
    );
    restoreEnvValue("VERCEL_BRANCH_URL", originalEnv.VERCEL_BRANCH_URL);
    restoreEnvValue("VERCEL_URL", originalEnv.VERCEL_URL);
    restoreEnvValue("NODE_ENV", originalEnv.NODE_ENV);
  });

  it("prefers trusted configured environment URLs and normalizes trailing slashes", async () => {
    process.env.APP_URL = "https://bugs.example.com///";
    process.env.NEXT_PUBLIC_APP_URL = "https://public.example.com";

    await expect(getAppBaseUrl()).resolves.toBe("https://bugs.example.com");
    expect(headersMock).not.toHaveBeenCalled();
  });

  it("uses request headers only in development as a local fallback", async () => {
    delete process.env.APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_BRANCH_URL;
    delete process.env.VERCEL_URL;
    restoreEnvValue("NODE_ENV", "development");
    headersMock.mockResolvedValue(
      new Headers({
        host: "localhost:4000",
        "x-forwarded-proto": "http",
      })
    );

    await expect(getAppBaseUrl()).resolves.toBe("http://localhost:4000");
  });

  it("does not trust forwarded hosts in production without a configured base URL", async () => {
    delete process.env.APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_BRANCH_URL;
    delete process.env.VERCEL_URL;
    restoreEnvValue("NODE_ENV", "production");
    headersMock.mockResolvedValue(
      new Headers({
        host: "attacker.example.com",
        "x-forwarded-proto": "https",
      })
    );

    await expect(getAppBaseUrl()).rejects.toThrow(
      "Unable to determine the application base URL. Set APP_URL or NEXT_PUBLIC_APP_URL."
    );
  });
});
