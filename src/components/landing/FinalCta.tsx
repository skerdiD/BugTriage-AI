import Link from "next/link";
import { ArrowRight, CheckCircle2, PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="render-deferred px-5 py-16 sm:px-6 md:py-24">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-[#0d0d16] px-6 py-12 shadow-[0_40px_140px_-60px_rgba(139,92,246,0.42)] sm:px-10 md:py-16 lg:px-16">
        <div className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-violet-500/20 blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-40 -right-24 size-96 rounded-full bg-cyan-400/10 blur-[110px]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.025),transparent)]" />

        <div className="relative mx-auto max-w-3xl text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-300/10">
            <PlayCircle className="size-5 text-violet-100" />
          </span>
          <p className="mt-6 text-xs font-semibold tracking-[0.22em] text-violet-200 uppercase">
            See the whole product
          </p>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.04em] text-white md:text-5xl">
            Give your next bug report a better starting point.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-8 text-slate-300">
            Open the read-only demo to inspect the dashboard, AI-triaged tickets,
            analytics, and team workflow with realistic data already loaded.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 w-full rounded-full bg-white px-7 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-violet-50 sm:w-auto"
            >
              <Link href="/login">
                Open live demo
                <ArrowRight className="size-4" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 w-full rounded-full border-white/15 bg-white/[0.04] px-7 text-sm text-white transition hover:-translate-y-0.5 hover:bg-white/[0.08] sm:w-auto"
            >
              <Link href="/signup">Create a workspace</Link>
            </Button>
          </div>

          <p className="mt-5 inline-flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="size-3.5 text-emerald-300" />
            Demo access requires no account or setup
          </p>
        </div>
      </div>
    </section>
  );
}
