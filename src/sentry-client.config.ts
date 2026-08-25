import {
  captureException,
  captureRouterTransitionStart,
  consoleLoggingIntegration,
  init,
} from "@sentry/nextjs";
import type { CaptureContext } from "@sentry/nextjs";

import {
  getSentryReplayConfig,
  getSharedSentryOptions,
  getSentryTracesSampleRate,
} from "@/lib/observability/sentry";

const replayConfig = getSentryReplayConfig();

init({
  ...getSharedSentryOptions("client"),
  tracesSampleRate: getSentryTracesSampleRate(),
  ...replayConfig,
  integrations: [
    consoleLoggingIntegration({
      levels: ["warn", "error"],
    }),
  ],
});

// Replay is useful after an error, but its DOM observers and recorder are too
// expensive for startup. Load it only after monitoring itself has initialized
// and the browser reaches another idle window.
if (
  typeof window !== "undefined" &&
  (replayConfig.replaysSessionSampleRate > 0 ||
    replayConfig.replaysOnErrorSampleRate > 0)
) {
  const loadReplay = () => {
    void import("./sentry-replay.client").then(({ enableSentryReplay }) => {
      enableSentryReplay();
    });
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(loadReplay, { timeout: 5_000 });
  } else {
    globalThis.setTimeout(loadReplay, 5_000);
  }
}

export function captureRouterTransition(
  href: string,
  navigationType: string
) {
  captureRouterTransitionStart(href, navigationType);
}

export function captureClientError(
  error: unknown,
  context?: CaptureContext
) {
  captureException(error, context);
}
