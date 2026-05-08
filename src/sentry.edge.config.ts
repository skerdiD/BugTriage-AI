import * as Sentry from "@sentry/nextjs";

import {
  getSharedSentryOptions,
  getSentryTracesSampleRate,
} from "@/lib/observability/sentry";

Sentry.init({
  ...getSharedSentryOptions(),
  tracesSampleRate: getSentryTracesSampleRate(),
});
