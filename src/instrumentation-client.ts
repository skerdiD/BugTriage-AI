import * as Sentry from "@sentry/nextjs";

import {
  getSentryReplayConfig,
  getSharedSentryOptions,
  getSentryTracesSampleRate,
} from "@/lib/observability/sentry";

Sentry.init({
  ...getSharedSentryOptions("client"),
  tracesSampleRate: getSentryTracesSampleRate(),
  ...getSentryReplayConfig(),
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
      maskAllInputs: true,
    }),
    Sentry.consoleLoggingIntegration({
      levels: ["warn", "error"],
    }),
  ],
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
