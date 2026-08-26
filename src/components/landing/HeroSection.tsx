import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  LockKeyhole,
  PlayCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { TriagePipeline } from "@/components/landing/TriagePipeline";
import { Button } from "@/components/ui/button";

const trustSignals = [
  { icon: PlayCircle, label: "No signup for the demo" },
  { icon: LockKeyhole, label: "Private evidence uploads" },
  { icon: ShieldCheck, label: "Workspace-scoped access" },
  { icon: CheckCircle2, label: "Validated, editable AI drafts" },
] as const;

export function HeroSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-10 pt-8 sm:px-6 md:pb-14 md:pt-12">
      <div className="grid items-center gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-12">
        <div className="landing-fade-up text-center lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-[0.68rem] font-semibold tracking-[0.18em] text-cyan-100 uppercase shadow-[0_16px_50px_-32px_rgba(34,211,238,0.9)] sm:text-xs">
            <Sparkles className="size-3.5" />
            AI triage for product teams
          </div>

          <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.04] tracking-[-0.035em] text-white sm:text-5xl lg:text-[3.55rem]">
            Bug reports arrive half-finished. That&apos;s fine.
            <span className="mt-2 block bg-gradient-to-r from-cyan-200 via-white to-violet-200 bg-clip-text text-transparent">
              Turn them into tickets engineers can use.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-7 text-slate-200 sm:text-lg sm:leading-8 lg:mx-0">
            Keep the original report, screenshots, and logs together. BugTriage AI
            adds a reviewable first pass with impact, reproduction steps, likely
            cause, and the next useful check.
          </p>

          <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center lg:justify-start">
            <Button
              asChild
              size="lg"
              className="h-12 w-full rounded-full bg-white px-7 text-sm font-semibold text-slate-950 shadow-[0_20px_60px_-28px_rgba(255,255,255,0.9)] transition active:scale-[0.98] hover:bg-cyan-50 sm:w-auto"
            >
              <Link href="/login" aria-label="Explore the BugTriage AI demo">
                Explore demo
                <ArrowRight className="size-4" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 w-full rounded-full border-white/15 bg-white/[0.045] px-7 text-sm font-medium text-white transition active:scale-[0.98] hover:border-cyan-200/25 hover:bg-white/[0.09] sm:w-auto"
            >
              <Link href="#product-preview">See report-to-ticket workflow</Link>
            </Button>
          </div>

          <p className="mt-4 text-sm text-slate-300">
            Read-only demo data. No account or setup required.
          </p>
        </div>

        <div className="landing-fade-up landing-delay-2 min-w-0">
          <div className="relative rounded-[28px] border border-white/15 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(34,211,238,0.08),rgba(15,23,42,0.76))] p-2.5 shadow-[0_36px_120px_-52px_rgba(34,211,238,0.35)] sm:p-3">
            <div className="flex items-center justify-between gap-3 rounded-t-[21px] border-b border-white/10 bg-[#0b0c13] px-4 py-3">
              <div className="flex gap-1.5" aria-hidden="true">
                <span className="size-2.5 rounded-full bg-rose-300/70" />
                <span className="size-2.5 rounded-full bg-amber-300/70" />
                <span className="size-2.5 rounded-full bg-emerald-300/70" />
              </div>
              <p className="text-[0.68rem] font-medium tracking-[0.15em] text-slate-300 uppercase sm:text-xs">
                <span className="sm:hidden">Live product</span>
                <span className="hidden sm:inline">
                  Live product · demo workspace
                </span>
              </p>
              <span className="flex items-center gap-1.5 text-[0.68rem] text-emerald-200 sm:text-xs">
                <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.85)]" />
                Ready
              </span>
            </div>

            <div className="relative aspect-[4/3] overflow-hidden rounded-b-[21px] bg-[#08080d] sm:aspect-[16/9] lg:aspect-[1.82/1]">
              <Image
                src="/engineering-dashboard.png"
                alt="BugTriage AI engineering dashboard showing ticket health, severity, and reporting trends"
                fill
                priority
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 88vw, 58vw"
                className="object-cover object-left-top"
              />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgba(5,6,11,0.32),transparent_35%)]" />
            </div>

            <div className="absolute -bottom-5 left-4 hidden items-center gap-3 rounded-2xl border border-emerald-300/20 bg-[#10151a]/95 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur sm:flex lg:left-7">
              <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-300/10">
                <CheckCircle2 className="size-4 text-emerald-200" />
              </span>
              <div>
                <p className="text-xs font-semibold text-white">
                  Real interface, realistic data
                </p>
                <p className="mt-0.5 text-[0.7rem] text-slate-300">
                  Explore the complete workflow
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-[24px] border border-white/12 bg-white/[0.035] p-3 shadow-[0_24px_80px_-64px_rgba(0,0,0,0.95)] lg:mt-12">
        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-[auto_repeat(4,1fr)] lg:items-center">
          <p className="px-3 py-2 text-xs font-semibold tracking-[0.16em] text-slate-300 uppercase">
            Production-minded by design
          </p>
          {trustSignals.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2.5 rounded-[17px] bg-slate-950/40 px-3 py-2.5 text-sm text-slate-200"
            >
              <item.icon className="size-4 shrink-0 text-emerald-200" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <TriagePipeline />
    </section>
  );
}
