import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { BeforeAfterPreview } from "@/components/landing/before-after-preview";
import {
  landingInsightCards,
} from "@/components/landing/landing-data";
import { LandingReveal } from "@/components/landing/landing-reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function LandingHero() {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-16 pt-14 md:pb-20 lg:pt-18">
      <div className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
        <LandingReveal className="relative">
          <Badge className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1.5 text-[0.74rem] tracking-[0.16em] text-cyan-100 uppercase shadow-[0_12px_30px_-18px_rgba(14,165,233,0.65)]">
            AI-powered bug triage
          </Badge>

          <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.8rem] lg:leading-[1.02]">
            Turn messy bug reports into engineering-ready tickets.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            BugTriage AI helps teams convert vague user complaints, screenshots,
            logs, and technical context into structured tickets with severity,
            category, reproduction steps, likely cause, and suggested fixes.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-white px-6 text-base text-slate-950 shadow-[0_20px_45px_-24px_rgba(255,255,255,0.7)] hover:bg-slate-100"
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
              className="h-12 rounded-full border-white/12 bg-white/[0.035] px-6 text-base text-white hover:bg-white/[0.08]"
            >
              <Link href="/dashboard">View dashboard</Link>
            </Button>
          </div>

          <div className="mt-5 flex items-center gap-2 text-sm text-slate-400">
            <ShieldCheck className="size-4 text-emerald-200" />
            Private uploads, validated AI output, and protected workspace routes
          </div>
        </LandingReveal>

        <LandingReveal delayMs={110}>
          <BeforeAfterPreview />
        </LandingReveal>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {landingInsightCards.map((item, index) => (
          <LandingReveal key={item.label} delayMs={index * 70}>
            <Card className="rounded-[26px] border-white/10 bg-white/[0.035] shadow-[0_28px_70px_-56px_rgba(0,0,0,0.95)] transition-transform duration-300 hover:-translate-y-1">
              <CardContent className="p-5">
                <p className="text-xs tracking-[0.18em] text-slate-500 uppercase">
                  {item.label}
                </p>
                <p className="mt-3 text-2xl font-semibold tracking-tight text-white">
                  {item.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {item.detail}
                </p>
              </CardContent>
            </Card>
          </LandingReveal>
        ))}
      </div>
    </section>
  );
}
