"use client";

import { useEffect } from "react";

import { captureClientException } from "@/lib/observability/client-monitoring";

import "./globals.css";

export default function GlobalError({
  error,
  unstable_retry: unstableRetry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    captureClientException(error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <main id="main-content" className="flex min-h-screen items-center justify-center px-6 py-16">
          <div className="w-full max-w-lg rounded-2xl border border-border/80 bg-card/85 p-8 shadow-2xl shadow-black/30 backdrop-blur">
            <title>BugTriage AI | Error</title>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
              Unexpected error
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">
              That didn&apos;t work.
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              We saved the technical details for review. Try the same action once
              more, or return to the overview and keep working.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => unstableRetry()}
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                Try again
              </button>
              <a
                href="/dashboard"
                className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground/90 transition hover:bg-secondary"
              >
                Back to overview
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
