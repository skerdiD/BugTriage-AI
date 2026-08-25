import { ArrowDown, ArrowRight } from "lucide-react";

import { pipelineCards } from "@/components/landing/landing-data";

export function TriagePipeline() {
  return (
    <div className="mx-auto mt-8 w-full max-w-6xl landing-fade-up landing-delay-2 md:mt-10">
      <div className="mb-4 flex flex-col gap-1 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-cyan-100/80 uppercase">
            How the handoff changes
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
            From rough evidence to a reviewable next move
          </h2>
        </div>
        <p className="text-sm text-slate-300">
          The original report always stays attached.
        </p>
      </div>

      <div className="grid gap-2.5 rounded-[26px] border border-white/12 bg-white/[0.04] p-3 shadow-[0_28px_90px_-70px_rgba(0,0,0,0.95)] backdrop-blur md:grid-cols-[1fr_auto_1fr_auto_1fr] md:items-stretch">
        {pipelineCards.map((card, index) => (
          <div key={card.title} className="contents">
            <div
              className={`landing-pipeline-card landing-pipeline-card-${index + 1} group rounded-[20px] border border-white/12 bg-slate-950/55 p-4 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/[0.065]`}
            >
              <div className="flex items-start gap-3">
                <span className="relative flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.07]">
                  <card.icon className="size-4 text-cyan-100" />
                  <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full border border-slate-900 bg-cyan-200 text-[0.55rem] font-bold text-slate-950">
                    {index + 1}
                  </span>
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-[0.18em] text-slate-400 uppercase">
                    {card.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white">
                    {card.detail}
                  </p>
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
                        Needs review
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-slate-200">
                        Pick an owner
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {index < pipelineCards.length - 1 ? (
              <div className="landing-pipeline-connector flex items-center justify-center py-0.5 md:py-0">
                <ArrowDown className="size-4 text-cyan-100/70 md:hidden" />
                <ArrowRight className="hidden size-4 text-cyan-100/70 md:block" />
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
