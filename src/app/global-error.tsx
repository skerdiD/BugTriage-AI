"use client";

import { useEffect } from "react";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";

import { AppLogoMark } from "@/components/brand/app-logo-mark";
import { Button } from "@/components/ui/button";
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
        <main
          id="main-content"
          className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-6 sm:py-16"
        >
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_10%,rgba(139,92,246,0.2),transparent_32rem)]" />
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-card/85 p-6 shadow-2xl shadow-black/35 backdrop-blur sm:p-8">
            <title>BugTriage AI | Error</title>
            <div className="flex items-center justify-between gap-4">
              <AppLogoMark className="size-11" iconClassName="size-7" />
              <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200">
                Unexpected error
              </span>
            </div>
            <div className="mt-8 flex size-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10">
              <AlertTriangle className="size-5 text-red-300" />
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight">
              That didn&apos;t work.
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              We saved the technical details for review. Try the same action once
              more, or return to the overview and keep working.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={() => unstableRetry()}
                className="h-11 rounded-xl bg-violet-600 px-4 hover:bg-violet-500"
              >
                <RotateCcw className="size-4" />
                Try again
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-xl border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
              >
                <a href="/dashboard">
                  <ArrowLeft className="size-4" />
                  Back to overview
                </a>
              </Button>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
