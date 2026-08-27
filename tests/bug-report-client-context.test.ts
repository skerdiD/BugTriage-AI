import { describe, expect, it } from "vitest";

import { detectBugReportClientContext } from "@/lib/bug-report-client-context";

describe("detectBugReportClientContext", () => {
  it.each([
    [
      "Chrome",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36",
      "chrome",
    ],
    [
      "Safari",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.6 Safari/605.1.15",
      "safari",
    ],
    [
      "Firefox",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:142.0) Gecko/20100101 Firefox/142.0",
      "firefox",
    ],
    [
      "Edge",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0",
      "edge",
    ],
  ] as const)("detects %s without an added parser", (_name, userAgent, browser) => {
    expect(detectBugReportClientContext({ userAgent }).browser).toBe(browser);
  });

  it("does not label a known unsupported Chromium browser as Chrome", () => {
    const detected = detectBugReportClientContext({
      userAgent:
        "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/138.0.0.0 Mobile Safari/537.36 SamsungBrowser/28.0",
    });

    expect(detected.browser).toBeUndefined();
  });

  it("prefers explicit browser brands over a generic Chromium user agent", () => {
    const detected = detectBugReportClientContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36",
      userAgentData: {
        brands: [
          { brand: "Chromium", version: "140" },
          { brand: "Brave", version: "140" },
        ],
        mobile: false,
      },
    });

    expect(detected.browser).toBeUndefined();
  });

  it.each([
    [
      "iPhone",
      {
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 Version/18.6 Mobile/15E148 Safari/604.1",
      },
      "ios-mobile",
    ],
    [
      "Android phone",
      {
        userAgent:
          "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/140.0.0.0 Mobile Safari/537.36",
      },
      "android-mobile",
    ],
    [
      "Android tablet",
      {
        userAgent:
          "Mozilla/5.0 (Linux; Android 15; Pixel Tablet) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36",
      },
      "tablet",
    ],
    [
      "iPad using desktop mode",
      {
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.6 Safari/605.1.15",
        platform: "MacIntel",
        maxTouchPoints: 5,
      },
      "tablet",
    ],
    [
      "Windows desktop",
      {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36",
      },
      "desktop",
    ],
  ] as const)("maps %s to an existing device option", (_name, snapshot, device) => {
    expect(detectBugReportClientContext(snapshot).device).toBe(device);
  });

  it("leaves unknown browser and device context unselected", () => {
    expect(
      detectBugReportClientContext({ userAgent: "CustomClient/1.0" })
    ).toEqual({ browser: undefined, device: undefined });
  });
});
