import * as Sentry from "@sentry/nextjs";

import {
  getSharedSentryOptions,
  getSentryTracesSampleRate,
} from "@/lib/observability/sentry";

Sentry.init({
  ...getSharedSentryOptions("client"),
  tracesSampleRate: getSentryTracesSampleRate(),
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
