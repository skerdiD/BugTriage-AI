import { afterEach, describe, expect, it, vi } from "vitest";

import { getSupabasePublishableKey, getSupabaseStorageBucket } from "@/lib/supabase/env";

afterEach(() => vi.unstubAllEnvs());

describe("Docker public environment defaults", () => {
  it("accepts a publishable key when the optional anonymous key is empty", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "public-test-key");
    expect(getSupabasePublishableKey()).toBe("public-test-key");
  });

  it("uses the private bucket default when the build argument is empty", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET", "");
    expect(getSupabaseStorageBucket()).toBe("bugtriage-private");
  });
});
