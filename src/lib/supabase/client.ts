import { createBrowserClient } from "@supabase/ssr";

import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";

const SERVICE_UNAVAILABLE_RESPONSE = JSON.stringify({
  code: "service_unavailable",
  message: "The Supabase service is unavailable.",
});

/**
 * Supabase Auth logs rejected fetch promises before converting them to an
 * AuthRetryableFetchError. Returning a normal 503 response keeps network
 * failures in the SDK's regular error flow and avoids duplicate console noise.
 */
export function createSupabaseBrowserFetch(fetcher: typeof fetch): typeof fetch {
  return async (input, init) => {
    try {
      return await fetcher(input, init);
    } catch {
      return new Response(SERVICE_UNAVAILABLE_RESPONSE, {
        status: 503,
        statusText: "Service Unavailable",
        headers: {
          "Content-Type": "application/json",
        },
      });
    }
  };
}

export function createBrowserSupabaseClient() {
  const supabaseUrl = getSupabaseUrl();
  const supabaseAnonKey = getSupabasePublishableKey();

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: createSupabaseBrowserFetch(globalThis.fetch.bind(globalThis)),
    },
  });
}
