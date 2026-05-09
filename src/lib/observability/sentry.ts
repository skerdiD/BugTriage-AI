import type { Breadcrumb, ErrorEvent, Event } from "@sentry/nextjs";

import { redactSensitiveText } from "@/lib/security/redaction";

const APP_TAG = "bug-triage-ai";
const MAX_STRING_LENGTH = 240;
const MAX_COLLECTION_ITEMS = 10;

const SENSITIVE_KEY_PATTERN =
  /(description|steps|expected|actual|console|log|attachment|file|body|payload|cookie|authorization|token|secret|password|api[_-]?key)/i;
const SENSITIVE_HEADER_PATTERN =
  /^(authorization|cookie|set-cookie|x-api-key|x-supabase-api-version|x-supabase-authorization|x-forwarded-for)$/i;

function truncate(value: string, maxLength = MAX_STRING_LENGTH) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 12))}[TRUNCATED]`;
}

function sanitizeString(value: string) {
  return truncate(redactSensitiveText(value));
}

function sanitizeHeaders(headers: Record<string, string> | undefined) {
  if (!headers) {
    return headers;
  }

  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => {
      if (SENSITIVE_HEADER_PATTERN.test(key)) {
        return [key, "[REDACTED]"];
      }

      return [key, sanitizeString(value)];
    })
  );
}

function sanitizeUnknown(value: unknown, depth = 0): unknown {
  if (typeof value === "string") {
    return sanitizeString(value);
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_COLLECTION_ITEMS)
      .map((item) => sanitizeUnknown(item, depth + 1));
  }

  if (value && typeof value === "object" && depth < 2) {
    return sanitizeRecord(value as Record<string, unknown>, depth + 1);
  }

  return value;
}

function sanitizeRecord(
  value: Record<string, unknown> | undefined,
  depth = 0
): Record<string, unknown> | undefined {
  if (!value) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        return [key, "[REDACTED]"];
      }

      return [key, sanitizeUnknown(entryValue, depth)];
    })
  );
}

function sanitizeBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  return {
    ...breadcrumb,
    message:
      typeof breadcrumb.message === "string"
        ? sanitizeString(breadcrumb.message)
        : breadcrumb.message,
    data: sanitizeRecord(
      breadcrumb.data as Record<string, unknown> | undefined
    ) as Breadcrumb["data"],
  };
}

export function getSentryEnvironment() {
  return process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
}

export function getSentryDsn(runtime: "client" | "server" | "edge" = "server") {
  if (runtime === "client") {
    return process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;
  }

  return process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
}

export function getSentryTracesSampleRate() {
  return process.env.NODE_ENV === "production" ? 0.1 : 1;
}

export function getSharedSentryOptions(runtime: "client" | "server" | "edge" = "server") {
  const dsn = getSentryDsn(runtime);

  return {
    dsn,
    enabled: Boolean(dsn),
    environment: getSentryEnvironment(),
    sendDefaultPii: false,
    attachStacktrace: true,
    normalizeDepth: 3,
    maxBreadcrumbs: 20,
    initialScope: {
      tags: {
        app: APP_TAG,
      },
    },
    beforeSend(event: ErrorEvent) {
      return sanitizeSentryEvent(event);
    },
  };
}

export function sanitizeSentryEvent<T extends Event>(event: T): T {
  return {
    ...event,
    user: event.user
      ? {
          ...event.user,
          ip_address: undefined,
        }
      : event.user,
    request: event.request
      ? {
          ...event.request,
          data: undefined,
          cookies: undefined,
          headers: sanitizeHeaders(event.request.headers),
        }
      : event.request,
    extra: sanitizeRecord(
      event.extra as Record<string, unknown> | undefined
    ) as Event["extra"],
    contexts: sanitizeRecord(
      event.contexts as Record<string, unknown> | undefined
    ) as Event["contexts"],
    breadcrumbs: event.breadcrumbs?.map(sanitizeBreadcrumb),
  } as T;
}
