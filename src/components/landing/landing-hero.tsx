import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { LandingProductVisual } from "@/components/landing/landing-product-visual";
import { LandingReveal } from "@/components/landing/landing-reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  return (
    <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-18 pt-14 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-14 lg:pb-24 lg:pt-20">
      <LandingReveal className="relative">
        <Badge className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-[0.76rem] text-slate-200 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.8)]">
          Built for support, product, QA, and engineering handoff
        </Badge>

        <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Turn messy bug reports into engineering-ready tickets in seconds.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
          BugTriage AI converts screenshots, logs, user complaints, and unclear issue
          reports into structured tickets with severity, category, reproduction steps,
          likely cause, and suggested fixes.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full bg-[linear-gradient(135deg,#0891b2,#10b981)] px-6 text-base text-white shadow-lg shadow-cyan-950/60 hover:brightness-110"
          >
            <Link href="/submit-bug">
              Submit Demo Bug
              <ArrowRight className="size-4" />
            </Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 rounded-full border-white/10 bg-white/[0.04] px-6 text-base text-white hover:bg-white/[0.08]"
          >
            <Link href="/dashboard">View Dashboard</Link>
          </Button>
        </div>

        <div className="mt-5 flex items-center gap-2 text-sm text-slate-400">
          <ShieldCheck className="size-4 text-emerald-200" />
          AI triage, secure uploads, and structured output for real engineering workflows
        </div>
      </LandingReveal>

      <LandingReveal delayMs={120}>
        <LandingProductVisual />
      </LandingReveal>
    </section>
  );
}
