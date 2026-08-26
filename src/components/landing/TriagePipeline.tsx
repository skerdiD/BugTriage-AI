import { ArrowRight } from "lucide-react";

import { pipelineCards } from "@/components/landing/landing-data";

export function TriagePipeline() {
  return (
    <div className="mx-auto mt-12 max-w-6xl border-y border-white/[0.08] py-7 sm:mt-16">
      <div className="grid gap-4 md:grid-cols-[0.72fr_1.28fr] md:items-center">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-violet-200 uppercase">
            One connected workflow
          </p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
            Signal in. Clear next step out.
          </h2>
        </div>

        <ol className="grid gap-2 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
          {pipelineCards.map((card, index) => (
            <li key={card.title} className="contents">
              <div className="group flex min-h-20 items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-3.5 transition duration-300 hover:border-violet-300/20 hover:bg-white/[0.055]">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-300/[0.09] text-violet-100">
                  <card.icon className="size-4" />
                </span>
                <div>
                  <p className="text-[0.64rem] font-semibold tracking-[0.15em] text-slate-500 uppercase">
                    0{index + 1} · {card.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-200">
                    {card.shortDetail}
                  </p>
                </div>
              </div>
              {index < pipelineCards.length - 1 ? (
                <ArrowRight className="mx-auto hidden size-4 text-violet-300/70 sm:block" />
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
