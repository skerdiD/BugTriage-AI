import { describe, expect, it } from "vitest";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";

import { config } from "../proxy";

describe("proxy matcher", () => {
  it("runs for application routes that need auth/session handling", () => {
    expect(
      unstable_doesMiddlewareMatch({
        config,
        nextConfig: {},
        url: "/dashboard",
      })
    ).toBe(true);

    expect(
      unstable_doesMiddlewareMatch({
        config,
        nextConfig: {},
        url: "/submit-bug",
      })
    ).toBe(true);
  });

  it("skips static framework and asset requests", () => {
    expect(
      unstable_doesMiddlewareMatch({
        config,
        nextConfig: {},
        url: "/_next/static/chunks/app.js",
      })
    ).toBe(false);

    expect(
      unstable_doesMiddlewareMatch({
        config,
        nextConfig: {},
        url: "/next.svg",
      })
    ).toBe(false);

    expect(
      unstable_doesMiddlewareMatch({
        config,
        nextConfig: {},
        url: "/robots.txt",
      })
    ).toBe(false);
  });
});
