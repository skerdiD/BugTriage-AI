import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

import { proofCards } from "@/components/landing/landing-data";
import { TriagePipeline } from "@/components/landing/TriagePipeline";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 pb-12 pt-10 sm:px-6 md:pb-16 md:pt-14">
      <div className="mx-auto max-w-4xl text-center landing-fade-up">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-medium tracking-[0.2em] text-cyan-100 uppercase shadow-[0_16px_50px_-32px_rgba(34,211,238,0.9)]">
          <Sparkles className="size-3.5" />
          Built for support, QA, and engineering
        </div>

        <h1 className="mx-auto mt-6 max-w-4xl text-balance text-4xl font-semibold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-[4rem]">
          Turn rough bug reports into tickets engineers can act on.
        </h1>

        <p className="mx-auto mt-5 max-w-3xl text-pretty text-base leading-8 text-slate-300 sm:text-lg">
          Paste in the complaint, attach the screenshot or logs, and get a
          consistent ticket with impact, reproduction steps, and a practical
          place to start investigating.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="h-11 w-full rounded-full bg-white px-6 text-sm text-slate-950 shadow-[0_18px_55px_-28px_rgba(255,255,255,0.85)] transition active:scale-[0.98] hover:bg-slate-100 sm:w-auto"
          >
            <Link href="/login" aria-label="Explore the demo workspace">
              Explore the demo
              <ArrowRight className="size-4" />
            </Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-11 w-full rounded-full border-white/12 bg-white/[0.035] px-6 text-sm text-white transition active:scale-[0.98] hover:bg-white/[0.08] sm:w-auto"
          >
            <Link href="#product-preview">
              See an example
            </Link>
          </Button>
        </div>

        <p className="mt-5 inline-flex flex-wrap items-center justify-center gap-2 text-sm text-slate-400">
          <ShieldCheck className="size-4 text-emerald-200" />
          Screenshots and logs stay private to the people in your workspace.
        </p>
      </div>

      <TriagePipeline />

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {proofCards.map((card, index) => (
          <div
            key={card.title}
            className="landing-fade-up rounded-[22px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_24px_70px_-58px_rgba(0,0,0,0.9)] transition duration-300 hover:-translate-y-1 hover:border-white/16 hover:bg-white/[0.045]"
            style={{ animationDelay: `${180 + index * 80}ms` }}
          >
            <p className="text-xs font-medium tracking-[0.18em] text-slate-500 uppercase">
              {card.title}
            </p>
            <p className="mt-3 text-lg font-semibold tracking-tight text-white">
              {card.value}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
