import "server-only";

import { headers } from "next/headers";

const TRUSTED_APP_URL_ENV_KEYS = [
  "APP_URL",
  "NEXT_PUBLIC_APP_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_BRANCH_URL",
  "VERCEL_URL",
] as const;

function normalizeBaseUrl(value: string) {
  const trimmedValue = value.trim();

  if (
    !trimmedValue ||
    trimmedValue.toLowerCase() === "undefined" ||
    trimmedValue.toLowerCase() === "null"
  ) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;

  try {
    const parsed = new URL(withProtocol);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    parsed.pathname = "";
    parsed.search = "";
    parsed.hash = "";

    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}

function getConfiguredAppBaseUrl() {
  for (const envKey of TRUSTED_APP_URL_ENV_KEYS) {
    const normalized = normalizeBaseUrl(process.env[envKey]?.trim() ?? "");

    if (normalized) {
      return normalized;
    }
  }

  return null;
}

export async function getAppBaseUrl() {
  const configuredBaseUrl = getConfiguredAppBaseUrl();

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (process.env.NODE_ENV === "development") {
    const requestHeaders = await headers();
    const forwardedHost =
      requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

    if (forwardedHost) {
      const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
      const derivedDevelopmentUrl = normalizeBaseUrl(
        `${protocol}://${forwardedHost}`
      );

      if (derivedDevelopmentUrl) {
        return derivedDevelopmentUrl;
      }
    }

    return "http://localhost:3000";
  }

  throw new Error(
    "Unable to determine the application base URL. Set APP_URL or NEXT_PUBLIC_APP_URL."
  );
}

export async function buildAppUrl(pathname: string) {
  const baseUrl = await getAppBaseUrl();
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;

  return `${baseUrl}${normalizedPath}`;
}
