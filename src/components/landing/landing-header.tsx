import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050816]/82 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-2xl transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
        >
          <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,#0f172a,#0ea5e9,#34d399)] shadow-lg shadow-cyan-950/60">
            <Sparkles className="size-5 text-white" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-[0.22em] text-white/60 uppercase">
              BugTriage AI
            </p>
            <p className="text-sm text-slate-300">AI bug triage workspace</p>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            asChild
            variant="ghost"
            className="rounded-full px-4 text-slate-200 hover:bg-white/[0.06] hover:text-white"
          >
            <Link href="/login">Sign in</Link>
          </Button>

          <Button
            asChild
            className="rounded-full bg-white px-4 text-slate-950 shadow-[0_14px_32px_-18px_rgba(255,255,255,0.75)] hover:bg-slate-100 sm:px-5"
          >
            <Link href="/dashboard">
              Open app
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
