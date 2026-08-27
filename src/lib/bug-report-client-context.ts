import type {
  supportedBugReportBrowsers,
  supportedBugReportDevices,
} from "@/lib/validation/bug-report";

type SupportedBrowser = (typeof supportedBugReportBrowsers)[number];
type SupportedDevice = (typeof supportedBugReportDevices)[number];

type UserAgentBrand = {
  brand: string;
  version: string;
};

export type BugReportNavigatorSnapshot = {
  userAgent: string;
  platform?: string;
  maxTouchPoints?: number;
  userAgentData?: {
    brands: readonly UserAgentBrand[];
    mobile: boolean;
  };
};

export type DetectedBugReportContext = {
  browser?: SupportedBrowser;
  device?: SupportedDevice;
};

const UNSUPPORTED_CHROMIUM_BROWSER_REGEX =
  /\b(?:DuckDuckGo|OPR|Opera|SamsungBrowser|Vivaldi|YaBrowser)\//i;

function detectBrowser({
  userAgent,
  userAgentData,
}: BugReportNavigatorSnapshot): SupportedBrowser | undefined {
  const productBrands = (userAgentData?.brands ?? [])
    .map(({ brand }) => brand.toLowerCase())
    .filter(
      (brand) =>
        brand !== "chromium" &&
        !brand.includes("not") &&
        !brand.includes("brand")
    );

  if (productBrands.some((brand) => brand.includes("microsoft edge"))) {
    return "edge";
  }

  if (
    productBrands.length > 0 &&
    productBrands.every((brand) => brand === "google chrome")
  ) {
    return "chrome";
  }

  if (userAgentData) {
    return undefined;
  }

  if (/\b(?:Edg|EdgA|EdgiOS)\//i.test(userAgent)) {
    return "edge";
  }

  if (/\b(?:Firefox|FxiOS)\//i.test(userAgent)) {
    return "firefox";
  }

  if (
    !UNSUPPORTED_CHROMIUM_BROWSER_REGEX.test(userAgent) &&
    !/; wv\)/i.test(userAgent) &&
    /\b(?:Chrome|CriOS)\//i.test(userAgent)
  ) {
    return "chrome";
  }

  if (/\bVersion\//i.test(userAgent) && /\bSafari\//i.test(userAgent)) {
    return "safari";
  }

  return undefined;
}

function detectDevice({
  userAgent,
  platform = "",
  maxTouchPoints = 0,
}: BugReportNavigatorSnapshot): SupportedDevice | undefined {
  if (
    /\biPad\b/i.test(userAgent) ||
    (platform === "MacIntel" && maxTouchPoints > 1)
  ) {
    return "tablet";
  }

  if (/\b(?:iPhone|iPod)\b/i.test(userAgent)) {
    return "ios-mobile";
  }

  if (/\bAndroid\b/i.test(userAgent)) {
    return /\bMobile\b/i.test(userAgent) ? "android-mobile" : "tablet";
  }

  if (/\bTablet\b/i.test(userAgent)) {
    return "tablet";
  }

  if (/\b(?:Windows NT|Macintosh|CrOS|X11|Linux x86_64)\b/i.test(userAgent)) {
    return "desktop";
  }

  return undefined;
}

export function detectBugReportClientContext(
  snapshot: BugReportNavigatorSnapshot
): DetectedBugReportContext {
  return {
    browser: detectBrowser(snapshot),
    device: detectDevice(snapshot),
  };
}
