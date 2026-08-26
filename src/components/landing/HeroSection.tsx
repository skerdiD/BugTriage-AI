import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CircleDot,
  GitBranch,
  Search,
  Sparkles,
} from "lucide-react";

import engineeringDashboard from "../../../public/engineering-dashboard.png";

import { TriagePipeline } from "@/components/landing/TriagePipeline";
import { Button } from "@/components/ui/button";

const outcomes = [
  "Structured AI analysis",
  "Similar-issue discovery",
  "GitHub Issues export",
] as const;

export function HeroSection() {
  return (
    <section className="relative px-5 pb-14 pt-16 sm:px-6 sm:pt-20 lg:pb-20 lg:pt-24">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[42rem] w-[64rem] -translate-x-1/2 rounded-full bg-violet-500/[0.08] blur-[120px]" />

      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.07] px-3.5 py-2 text-xs font-semibold tracking-[0.14em] text-violet-100 uppercase shadow-[0_0_32px_rgba(139,92,246,0.12)]">
            <Sparkles className="size-3.5" />
            AI triage for product teams
          </div>

          <h1 className="mt-7 text-balance text-[2.8rem] font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl lg:text-[5.25rem]">
            Turn messy bug reports into{" "}
            <span className="block bg-gradient-to-r from-violet-300 via-cyan-100 to-emerald-200 bg-clip-text text-transparent">
              engineering-ready tickets.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
            Bring the original report, screenshots, and logs together. BugTriage AI
            turns that context into a reviewable first pass with severity,
            reproduction steps, likely cause, and the next useful check.
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Button
              asChild
              size="lg"
              className="h-12 w-full rounded-full bg-white px-7 text-sm font-semibold text-slate-950 shadow-[0_18px_50px_-20px_rgba(255,255,255,0.72)] transition hover:-translate-y-0.5 hover:bg-violet-50 active:translate-y-0 sm:w-auto"
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
              className="h-12 w-full rounded-full border-white/15 bg-white/[0.04] px-7 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:border-violet-200/30 hover:bg-white/[0.08] active:translate-y-0 sm:w-auto"
            >
              <Link href="#product-preview">See how it works</Link>
            </Button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-400 sm:text-sm">
            <span className="flex items-center gap-2">
              <CircleDot className="size-3.5 text-emerald-300" />
              No signup for the demo
            </span>
            <span className="hidden h-3 w-px bg-white/15 sm:block" />
            <span>Real interface · realistic data</span>
          </div>
        </div>

        <div className="relative mx-auto mt-12 max-w-6xl sm:mt-14">
          <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-r from-violet-500/20 via-cyan-400/10 to-emerald-400/15 blur-3xl" />
          <div className="overflow-hidden rounded-[1.4rem] border border-white/15 bg-[#0d0d15] p-1.5 shadow-[0_42px_140px_-45px_rgba(0,0,0,0.95)] sm:rounded-[1.8rem] sm:p-2.5">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-3 py-2.5 sm:px-4">
              <div className="flex gap-1.5" aria-hidden="true">
                <span className="size-2 rounded-full bg-rose-400/80" />
                <span className="size-2 rounded-full bg-amber-300/80" />
                <span className="size-2 rounded-full bg-emerald-300/80" />
              </div>
              <div className="flex items-center gap-2 text-[0.62rem] font-medium tracking-[0.12em] text-slate-400 uppercase sm:text-xs">
                <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.8)]" />
                Live product preview
              </div>
              <div className="w-9" aria-hidden="true" />
            </div>

            <div className="relative aspect-[1.72/1] overflow-hidden rounded-b-[1rem] bg-[#08080d] sm:aspect-[2.04/1] sm:rounded-b-[1.25rem]">
              <Image
                src={engineeringDashboard}
                alt="BugTriage AI engineering dashboard with ticket health, severity distribution, and report trends"
                fill
                priority
                placeholder="blur"
                sizes="(max-width: 768px) 94vw, 1152px"
                className="object-cover object-left-top"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-[#08080d]/30 to-transparent" />
            </div>
          </div>

          <div className="absolute -bottom-6 left-5 hidden items-center gap-3 rounded-2xl border border-white/10 bg-[#12121b]/95 px-4 py-3 shadow-2xl shadow-black/60 backdrop-blur-xl md:flex">
            <span className="flex size-9 items-center justify-center rounded-xl bg-violet-400/10">
              <Search className="size-4 text-violet-200" />
            </span>
            <div>
              <p className="text-xs font-semibold text-white">Similar issues surfaced</p>
              <p className="mt-0.5 text-[0.7rem] text-slate-400">Before duplicate work begins</p>
            </div>
          </div>

          <div className="absolute -bottom-6 right-5 hidden items-center gap-3 rounded-2xl border border-emerald-300/15 bg-[#101a18]/95 px-4 py-3 shadow-2xl shadow-black/60 backdrop-blur-xl md:flex">
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-300/10">
              <GitBranch className="size-4 text-emerald-200" />
            </span>
            <div>
              <p className="text-xs font-semibold text-white">Ready for engineering</p>
              <p className="mt-0.5 text-[0.7rem] text-slate-400">Review, assign, or export to GitHub</p>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 flex max-w-4xl flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm text-slate-300 md:mt-14">
          {outcomes.map((outcome) => (
            <span key={outcome} className="flex items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-emerald-300/10">
                <Check className="size-3 text-emerald-200" />
              </span>
              {outcome}
            </span>
          ))}
        </div>

        <TriagePipeline />
      </div>
    </section>
  );
}
