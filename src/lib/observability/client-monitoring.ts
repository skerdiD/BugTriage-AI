import type { CaptureContext } from "@sentry/nextjs";

export function captureClientException(
  error: unknown,
  context?: CaptureContext
) {
  void import("../../sentry-client.config").then(({ captureClientError }) => {
    captureClientError(error, context);
  });
}
