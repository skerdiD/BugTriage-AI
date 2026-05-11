import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import {
  landingFeatureCards,
} from "@/components/landing/landing-data";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingReveal } from "@/components/landing/landing-reveal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function LandingPage() {
  return (
    <main className="relative overflow-hidden bg-[#030712]">
      <div className="pointer-events-none absolute inset-0 -z-30 bg-[#030712]" />
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_24rem),radial-gradient(circle_at_82%_16%,rgba(52,211,153,0.12),transparent_22rem),radial-gradient(circle_at_50%_100%,rgba(15,23,42,0.85),transparent_26rem)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:88px_88px] [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.78),transparent)] opacity-20" />

      <LandingHeader />
      <LandingHero />

      <section id="features" className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <LandingReveal className="max-w-2xl">
            <p className="text-xs tracking-[0.22em] text-cyan-100/70 uppercase">
              Product features
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Compact by design, but built for real bug triage work.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              The landing page now stays focused on the workflow that matters most:
              collecting messy inputs, structuring the issue, and handing engineering
              a cleaner ticket.
            </p>
          </LandingReveal>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {landingFeatureCards.map((feature, index) => (
              <LandingReveal key={feature.title} delayMs={index * 70}>
                <Card className="h-full rounded-[30px] border-white/10 bg-white/[0.035] shadow-[0_30px_90px_-58px_rgba(0,0,0,0.98)] transition-transform duration-300 hover:-translate-y-1.5">
                  <CardContent className="p-6">
                    <div className="flex size-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                      <feature.icon className="size-5 text-cyan-100" />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </LandingReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-16 pt-4 md:pb-20">
        <div className="mx-auto max-w-6xl px-6">
          <LandingReveal>
            <Card className="rounded-[34px] border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.07),rgba(8,145,178,0.18),rgba(15,23,42,0.92))] shadow-[0_40px_120px_-65px_rgba(0,0,0,0.98)]">
              <CardContent className="flex flex-col gap-8 p-8 md:p-10 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-1.5 text-[0.72rem] tracking-[0.18em] text-slate-200 uppercase">
                    <Sparkles className="size-3.5 text-cyan-100" />
                    Final CTA
                  </div>
                  <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                    Start with a messy report. End with a clean ticket.
                  </h2>
                  <p className="mt-4 text-base leading-8 text-slate-200/85">
                    Use BugTriage AI to make support-to-engineering handoff faster,
                    clearer, and more organized.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 rounded-full bg-white px-6 text-base text-slate-950 hover:bg-slate-100"
                  >
                    <Link href="/submit-bug">
                      Submit a bug
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-full border-white/14 bg-white/[0.04] px-6 text-base text-white hover:bg-white/[0.08]"
                  >
                    <Link href="/dashboard">Open dashboard</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </LandingReveal>
        </div>
      </section>

      <footer className="border-t border-white/8 pb-10 pt-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <p className="text-sm font-semibold tracking-[0.22em] text-white/60 uppercase">
              BugTriage AI
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              AI bug triage workspace for modern software teams.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
            <Link href="/login" className="transition-colors hover:text-white">
              Sign in
            </Link>
            <Link href="/submit-bug" className="transition-colors hover:text-white">
              Submit a bug
            </Link>
            <Link href="/dashboard" className="transition-colors hover:text-white">
              Open app
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
