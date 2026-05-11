import { ArrowRight } from "lucide-react";

import { pipelineCards } from "@/components/landing/landing-data";

export function TriagePipeline() {
  return (
    <div className="mx-auto mt-10 w-full max-w-5xl landing-fade-up landing-delay-2">
      <div className="grid gap-3 rounded-[26px] border border-white/10 bg-white/[0.035] p-3 shadow-[0_28px_90px_-70px_rgba(0,0,0,0.95)] backdrop-blur md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch">
        {pipelineCards.map((card, index) => (
          <div key={card.title} className="contents">
            <div className="group rounded-[20px] border border-white/10 bg-slate-950/45 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.055]">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
                  <card.icon className="size-4 text-cyan-100" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium tracking-[0.18em] text-slate-500 uppercase">
                    {card.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white">{card.detail}</p>
                  {index === 1 ? (
                    <div className="mt-3 grid grid-cols-3 gap-2 text-[0.68rem]">
                      <span className="rounded-full border border-rose-300/20 bg-rose-400/10 px-2 py-1 text-rose-100">
                        Critical
                      </span>
                      <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-1 text-cyan-100">
                        Payment
                      </span>
                      <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-emerald-100">
                        High
                      </span>
                    </div>
                  ) : null}
                  {index === 2 ? (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-[0.68rem]">
                      <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-emerald-100">
                        Triaged
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-slate-200">
                        Review fix path
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {index < pipelineCards.length - 1 ? (
              <div className="hidden items-center justify-center md:flex">
                <ArrowRight className="size-4 text-slate-500" />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
