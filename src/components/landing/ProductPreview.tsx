import { Camera, CheckCircle2, FileText, TerminalSquare } from "lucide-react";

import {
  inputChips,
  outputMeta,
  outputSteps,
} from "@/components/landing/landing-data";

function MetaBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "rose" | "cyan" | "emerald";
}) {
  const toneClass = {
    rose: "border-rose-300/20 bg-rose-400/10 text-rose-100",
    cyan: "border-cyan-300/20 bg-cyan-400/10 text-cyan-100",
    emerald: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
  }[tone];

  return (
    <div className={`rounded-2xl border px-3 py-2.5 ${toneClass}`}>
      <p className="text-[0.62rem] tracking-[0.18em] text-current/65 uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-current">{value}</p>
    </div>
  );
}

export function ProductPreview() {
  return (
    <section id="product-preview" className="scroll-mt-24 px-5 py-12 sm:px-6 md:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-medium tracking-[0.22em] text-cyan-100/75 uppercase">
            A real example
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            The context engineers need, without the back-and-forth.
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-300">
            Here is what happens when a short complaint, a screenshot, and a log
            are brought together in one ticket.
          </p>
        </div>

        <div className="group mt-9 rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.045),rgba(8,145,178,0.08),rgba(15,23,42,0.72))] p-3 shadow-[0_34px_110px_-72px_rgba(0,0,0,0.96)] transition duration-500 hover:border-cyan-200/20 hover:shadow-[0_42px_130px_-72px_rgba(34,211,238,0.3)]">
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-[24px] border border-white/10 bg-slate-950/55 p-5 md:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium tracking-[0.2em] text-slate-500 uppercase">
                    What came in
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    Support report
                  </h3>
                </div>
                <span className="flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                  <FileText className="size-4 text-amber-200" />
                </span>
              </div>

              <div className="mt-5 rounded-[20px] border border-white/10 bg-white/[0.035] p-4">
                <p className="text-sm leading-7 text-slate-200">
                  Checkout freezes on iPhone Safari after card details are entered.
                  User says the payment form stops responding and the submit button
                  never completes.
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {inputChips.map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-xs text-slate-200"
                  >
                    {chip}
                  </span>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <Camera className="size-4 text-cyan-100" />
                    Screenshot attached
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Payment form stuck after validation.
                  </p>
                </div>
                <div className="rounded-[18px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-sm font-medium text-white">
                    <TerminalSquare className="size-4 text-emerald-100" />
                    Console log attached
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Includes client-side payment event errors.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-cyan-300/15 bg-[linear-gradient(180deg,rgba(8,145,178,0.13),rgba(2,6,23,0.72))] p-5 md:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium tracking-[0.2em] text-cyan-100/70 uppercase">
                    What the team gets
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">
                    Safari mobile checkout freezes after card entry
                  </h3>
                </div>
                <span className="flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
                  <CheckCircle2 className="size-4 text-emerald-200" />
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {outputMeta.map((item) => (
                  <MetaBadge key={item.label} {...item} />
                ))}
              </div>

              <div className="mt-5 rounded-[20px] border border-white/10 bg-slate-950/45 p-4">
                <p className="text-xs font-medium tracking-[0.18em] text-slate-500 uppercase">
                  Reproduction steps
                </p>
                <div className="mt-3 space-y-3">
                  {outputSteps.map((step, index) => (
                    <div key={step} className="flex gap-3 text-sm text-slate-200">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-cyan-300/12 text-xs font-semibold text-cyan-100">
                        {index + 1}
                      </span>
                      <span className="leading-6">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm font-semibold text-white">Likely cause</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Safari-specific payment state handling fails after card
                    validation completes.
                  </p>
                </div>
                <div className="rounded-[18px] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm font-semibold text-white">Suggested fix</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Reproduce on iPhone Safari and harden post-validation submit
                    state transitions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
