
import { describe, expect, it } from "vitest";

import { sanitizeSentryEvent } from "@/lib/observability/sentry";

describe("sanitizeSentryEvent", () => {
  it("removes sensitive request bodies and auth headers", () => {
    const event = sanitizeSentryEvent({
      request: {
        headers: {
          authorization: "Bearer top-secret-token",
          "x-request-id": "req_12345",
        },
        data: {
          title: "Checkout is broken",
        },
        cookies: {
          sb: "secret-cookie",
        },
      },
      extra: {
        title: "Checkout button disabled",
        description: "User pasted payment logs here",
      },
    });

    expect(event.request?.data).toBeUndefined();
    expect(event.request?.cookies).toBeUndefined();
    expect(event.request?.headers).toEqual({
      authorization: "[REDACTED]",
      "x-request-id": "req_12345",
    });
    expect(event.extra).toEqual({
      title: "Checkout button disabled",
      description: "[REDACTED]",
    });
  });

  it("redacts nested log-style context values", () => {
    const event = sanitizeSentryEvent({
      contexts: {
        bugSubmission: {
          uploadedLogs: "fatal: token=abc123456789SECRET",
          metadata: {
            attachmentNames: ["error.log", "screenshot.png"],
          },
        },
      },
      breadcrumbs: [
        {
          category: "ui.click",
          message: "Submit bug report",
          data: {
            consoleLogs: "password=super-secret",
          },
        },
      ],
    });

    expect(event.contexts).toEqual({
      bugSubmission: {
        uploadedLogs: "[REDACTED]",
        metadata: {
          attachmentNames: "[REDACTED]",
        },
      },
    });
    expect(event.breadcrumbs?.[0]?.data).toEqual({
      consoleLogs: "[REDACTED]",
    });
  });

  it("redacts exception messages and request URLs before Sentry transport", () => {
    const event = sanitizeSentryEvent({
      message: "Export failed for token=ghp_1234567890SECRET1234567890SECRET",
      exception: {
        values: [
          {
            type: "Error",
            value:
              "GitHub request failed with Authorization: Bearer abcdef1234567890TOKEN0987654321",
          },
        ],
      },
      request: {
        url: "https://app.example/api/github/issues?token=ghp_1234567890SECRET",
      },
    });

    expect(event.message).toBe("Export failed for token=[REDACTED]");
    expect(event.exception?.values?.[0]?.value).toBe(
      "GitHub request failed with Authorization: Bearer [REDACTED]"
    );
    expect(event.request?.url).toBe(
      "https://app.example/api/github/issues?token=[REDACTED]"
    );
  });
});
