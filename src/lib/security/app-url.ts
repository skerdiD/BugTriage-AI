import "server-only";

import { headers } from "next/headers";

function normalizeBaseUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

export async function getAppBaseUrl() {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configuredBaseUrl) {
    return normalizeBaseUrl(configuredBaseUrl);
  }

  const requestHeaders = await headers();
  const forwardedHost =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (forwardedHost) {
    const protocol =
      requestHeaders.get("x-forwarded-proto") ??
      (process.env.NODE_ENV === "development" ? "http" : "https");

    return `${protocol}://${forwardedHost}`;
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  throw new Error(
    "Unable to determine the application base URL. Set NEXT_PUBLIC_APP_URL."
  );
}

export async function buildAppUrl(pathname: string) {
  const baseUrl = await getAppBaseUrl();
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;

  return `${baseUrl}${normalizedPath}`;
}
