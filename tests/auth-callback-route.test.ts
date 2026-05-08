import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createServerSupabaseClientMock,
  exchangeCodeForSessionMock,
  getArcjetDeniedMessageMock,
  logArcjetErrorMock,
  protectMock,
} = vi.hoisted(() => ({
  createServerSupabaseClientMock: vi.fn(),
  exchangeCodeForSessionMock: vi.fn(),
  getArcjetDeniedMessageMock: vi.fn(),
  logArcjetErrorMock: vi.fn(),
  protectMock: vi.fn(),
}));

vi.mock("@/lib/security/arcjet", () => ({
  authCallbackProtection: {
    protect: protectMock,
  },
  getArcjetDeniedMessage: getArcjetDeniedMessageMock,
  logArcjetError: logArcjetErrorMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
}));

import { GET } from "@/app/auth/callback/route";

function createAllowedDecision() {
  return {
    isDenied: () => false,
    isErrored: () => false,
    reason: {
      message: "Allowed.",
      isRateLimit: () => false,
      isBot: () => false,
      isShield: () => false,
    },
  };
}

describe("GET /auth/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    protectMock.mockResolvedValue(createAllowedDecision());
    createServerSupabaseClientMock.mockResolvedValue({
      auth: {
        exchangeCodeForSession: exchangeCodeForSessionMock,
      },
    });
  });

  it("returns a rate-limit response when security blocks the callback", async () => {
    protectMock.mockResolvedValue({
      isDenied: () => true,
      isErrored: () => false,
      reason: {
        message: "Too many requests.",
        isRateLimit: () => true,
        isBot: () => false,
        isShield: () => false,
      },
    });
    getArcjetDeniedMessageMock.mockReturnValue(
      "Too many requests. Please wait a few minutes and try again."
    );

    const response = await GET(
      new Request("http://127.0.0.1:3000/auth/callback?code=test-code")
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Too many requests. Please wait a few minutes and try again.",
    });
    expect(createServerSupabaseClientMock).not.toHaveBeenCalled();
  });

  it("exchanges the auth code and sanitizes unsafe redirects", async () => {
    const response = await GET(
      new Request(
        "http://127.0.0.1:3000/auth/callback?code=test-code&next=https://evil.example/pwned"
      )
    );

    expect(exchangeCodeForSessionMock).toHaveBeenCalledWith("test-code");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://127.0.0.1:3000/dashboard"
    );
  });
});
