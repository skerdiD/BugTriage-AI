import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

import { AppLogoMark } from "@/components/brand/app-logo-mark";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_10%,rgba(139,92,246,0.2),transparent_32rem)]" />

      <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl shadow-black/30 backdrop-blur md:p-9">
        <div className="flex items-center justify-between gap-4">
          <AppLogoMark className="size-11" iconClassName="size-7" />
          <span className="font-mono text-sm text-muted-foreground">404</span>
        </div>

        <div className="mt-10 flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
          <SearchX className="size-5 text-violet-300" />
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white">
          There&apos;s nothing at this address.
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          The ticket may have moved, the link may be incomplete, or your workspace
          may not have access to it.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="h-11 rounded-xl bg-violet-600 hover:bg-violet-500">
            <Link href="/dashboard">
              <ArrowLeft className="size-4" />
              Back to overview
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-11 rounded-xl border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
          >
            <Link href="/tickets">Search tickets</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
