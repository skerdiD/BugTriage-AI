import { describe, expect, it, vi } from "vitest";

import {
  createBrowserSupabaseClient,
  createSupabaseBrowserFetch,
} from "@/lib/supabase/client";

describe("Supabase browser fetch", () => {
  it("normalizes a rejected network request into a 503 response", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new TypeError("Failed to fetch (project.supabase.co)"));
    const resilientFetch = createSupabaseBrowserFetch(fetcher);

    const response = await resilientFetch("https://project.supabase.co/auth/v1/token");

    expect(response.status).toBe(503);
    expect(response.statusText).toBe("Service Unavailable");
    await expect(response.json()).resolves.toEqual({
      code: "service_unavailable",
      message: "The Supabase service is unavailable.",
    });
  });

  it("returns successful responses unchanged", async () => {
    const expectedResponse = new Response("{}", { status: 200 });
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(expectedResponse);
    const resilientFetch = createSupabaseBrowserFetch(fetcher);

    await expect(
      resilientFetch("https://project.supabase.co/auth/v1/health")
    ).resolves.toBe(expectedResponse);
  });

  it("keeps rejected Auth requests out of the console error path", async () => {
    const originalFetch = globalThis.fetch;
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    globalThis.fetch = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new TypeError("Failed to fetch"));

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: "developer@example.com",
        password: "not-a-real-password",
      });

      expect(error).toMatchObject({
        name: "AuthRetryableFetchError",
        status: 503,
      });
      expect(consoleError).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = originalFetch;
      consoleError.mockRestore();
    }
  });
});
