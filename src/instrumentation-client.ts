import { getSentryDsn } from "@/lib/observability/sentry";

let sentryClientPromise:
  | Promise<typeof import("./sentry-client.config")>
  | undefined;

function loadSentryClient() {
  sentryClientPromise ??= import("./sentry-client.config");
  return sentryClientPromise;
}

if (typeof window !== "undefined" && getSentryDsn("client")) {
  const initializeMonitoring = () => {
    void loadSentryClient();
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(initializeMonitoring, { timeout: 2_000 });
  } else {
    globalThis.setTimeout(initializeMonitoring, 2_000);
  }
}

export function onRouterTransitionStart(
  href: string,
  navigationType: string
) {
  if (!getSentryDsn("client")) return;

  void loadSentryClient().then(({ captureRouterTransition }) => {
    captureRouterTransition(href, navigationType);
  });
}
