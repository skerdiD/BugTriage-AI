import * as Sentry from "@sentry/nextjs";

import {
  getSharedSentryOptions,
  getSentryTracesSampleRate,
} from "@/lib/observability/sentry";

Sentry.init({
  ...getSharedSentryOptions("server"),
  tracesSampleRate: getSentryTracesSampleRate(),
  integrations: [
    Sentry.nodeRuntimeMetricsIntegration(),
    Sentry.consoleLoggingIntegration({
      levels: ["warn", "error"],
    }),
  ],
  shutdownTimeout: 2,
});
