import * as Sentry from "@sentry/nextjs";

import { getSafeErrorMessage, redactSensitiveText } from "@/lib/security/redaction";

type Primitive = string | number | boolean | null;

type MonitoringContext = Record<string, Primitive | undefined>;

type CaptureServerExceptionInput = {
  area: string;
  action: string;
  message?: string;
  level?: "error" | "warning" | "info";
  context?: MonitoringContext;
};

type ServerSpanInput = {
  name: string;
  op: string;
  context?: MonitoringContext;
};

const MAX_CONTEXT_STRING_LENGTH = 180;

function sanitizeContextValue(value: Primitive): Primitive {
  if (typeof value !== "string") {
    return value;
  }

  const sanitized = redactSensitiveText(value).slice(0, MAX_CONTEXT_STRING_LENGTH);
  return sanitized;
}

export function sanitizeMonitoringContext(context?: MonitoringContext) {
  if (!context) {
    return undefined;
  }

  const sanitizedEntries = Object.entries(context)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => [key, sanitizeContextValue(value as Primitive)] as const);

  if (sanitizedEntries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(sanitizedEntries) as Record<string, Primitive>;
}

export function addServerBreadcrumb(input: {
  category: string;
  message: string;
  level?: "info" | "warning" | "error";
  data?: MonitoringContext;
}) {
  Sentry.addBreadcrumb({
    category: input.category,
    message: redactSensitiveText(input.message),
    level: input.level ?? "info",
    data: sanitizeMonitoringContext(input.data),
  });
}

export function captureServerException(
  error: unknown,
  input: CaptureServerExceptionInput
) {
  const safeContext = sanitizeMonitoringContext(input.context);

  Sentry.captureException(error, {
    level: input.level ?? "error",
    tags: {
      area: input.area,
      action: input.action,
    },
    extra: safeContext,
  });

  const logMessage = input.message ?? `[${input.area}:${input.action}] server error`;

  if (process.env.NODE_ENV === "development") {
    console.error(logMessage, getSafeErrorMessage(error), safeContext ?? {});
    return;
  }

  console.error(logMessage, safeContext ?? {});
}

export async function withServerSpan<T>(
  input: ServerSpanInput,
  callback: () => Promise<T>
) {
  const safeContext = sanitizeMonitoringContext(input.context);
  const spanAttributes: Record<string, string | number | boolean> | undefined =
    safeContext
      ? Object.fromEntries(
          Object.entries(safeContext).filter(
            (
              entry
            ): entry is [string, string | number | boolean] => entry[1] !== null
          )
        )
      : undefined;
  const startedAt = Date.now();

  return Sentry.startSpan(
    {
      name: input.name,
      op: input.op,
      attributes: spanAttributes,
    },
    async () => {
      try {
        return await callback();
      } finally {
        if (process.env.NODE_ENV === "development") {
          console.info(
            `[perf] ${redactSensitiveText(input.name)} ${Date.now() - startedAt}ms`,
            safeContext ?? {}
          );
        }
      }
    }
  );
}
