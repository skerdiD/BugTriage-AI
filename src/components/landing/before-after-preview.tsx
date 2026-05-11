import {
  ArrowRight,
  Bug,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  previewChips,
  previewMeta,
  previewSteps,
  previewStructuredSections,
  type PreviewMetaItem,
} from "@/components/landing/landing-data";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

function PreviewMetaBadge({ label, value, tone }: PreviewMetaItem) {
  const toneClass =
    tone === "critical"
      ? "border-rose-400/20 bg-rose-500/10 text-rose-100"
      : tone === "success"
        ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-100"
        : "border-white/10 bg-white/[0.05] text-slate-100";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <p className="text-[0.65rem] tracking-[0.18em] uppercase text-current/70">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-current">{value}</p>
    </div>
  );
}

export function BeforeAfterPreview() {
  return (
    <Card className="overflow-hidden rounded-[32px] border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(7,13,28,0.94))] shadow-[0_38px_100px_-54px_rgba(0,0,0,0.98)]">
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-rose-400" />
            <span className="size-2.5 rounded-full bg-amber-300" />
            <span className="size-2.5 rounded-full bg-emerald-400" />
          </div>

          <Badge className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[0.68rem] text-slate-200 uppercase">
            App preview
          </Badge>
        </div>

        <div className="grid gap-4 p-5 xl:grid-cols-[0.88fr_auto_1.12fr] xl:items-stretch">
          <section
            aria-labelledby="raw-report-heading"
            className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.2em] text-slate-500 uppercase">
                  Raw bug report
                </p>
                <h3
                  id="raw-report-heading"
                  className="mt-2 text-xl font-semibold text-white"
                >
                  Checkout freezes on iPhone Safari
                </h3>
              </div>

              <span className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <Bug className="size-5 text-amber-200" />
              </span>
            </div>

            <div className="mt-4 rounded-[24px] border border-white/10 bg-black/20 p-4">
              <p className="text-[0.66rem] tracking-[0.2em] text-slate-500 uppercase">
                Incoming report
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                Checkout freezes on iPhone Safari after entering card details. User
                says payment form stops responding.
              </p>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {previewChips.map((chip) => (
                <Badge
                  key={chip}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-200"
                >
                  {chip}
                </Badge>
              ))}
            </div>

            <div className="mt-4 rounded-[22px] border border-amber-400/18 bg-amber-500/10 p-4 text-sm leading-6 text-amber-50">
              Priority is still unclear and engineering would need to rewrite this
              into a usable ticket before acting on it.
            </div>
          </section>

          <div className="hidden xl:flex xl:items-center xl:justify-center">
            <div className="flex size-14 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 shadow-[0_20px_45px_-28px_rgba(34,211,238,0.75)]">
              <ArrowRight className="size-5 text-cyan-100" />
            </div>
          </div>

          <section
            aria-labelledby="structured-ticket-heading"
            className="rounded-[28px] border border-cyan-400/18 bg-[linear-gradient(180deg,rgba(8,145,178,0.16),rgba(15,23,42,0.68))] p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.2em] text-cyan-100/70 uppercase">
                  AI structured ticket
                </p>
                <h3
                  id="structured-ticket-heading"
                  className="mt-2 text-xl font-semibold text-white"
                >
                  Safari mobile checkout freezes after card entry
                </h3>
              </div>

              <span className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08]">
                <Sparkles className="size-5 text-cyan-100" />
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {previewMeta.map((item) => (
                <PreviewMetaBadge key={item.label} {...item} />
              ))}
            </div>

            <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-950/52 p-4">
              <p className="text-[0.66rem] tracking-[0.2em] text-slate-400 uppercase">
                Reproduction steps
              </p>

              <div className="mt-3 space-y-2.5">
                {previewSteps.map((step, index) => (
                  <div key={step} className="flex items-start gap-3 text-sm leading-6 text-slate-200">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/12 text-[0.68rem] font-semibold text-cyan-100">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {previewStructuredSections.map((section) => (
                <div
                  key={section.title}
                  className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex items-center gap-2">
                    {section.title === "Likely cause" ? (
                      <FileText className="size-4 text-cyan-100" />
                    ) : (
                      <CheckCircle2 className="size-4 text-emerald-200" />
                    )}
                    <p className="text-sm font-semibold text-white">
                      {section.title}
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {section.body}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-300">
              <ShieldCheck className="size-4 text-emerald-200" />
              Structured output stays connected to uploads, ticket history, and
              workspace review flow.
            </div>
          </section>
        </div>

        <div className="border-t border-white/10 bg-black/16 px-5 py-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
              Raw report
            </span>
            <ArrowRight className="size-4 text-cyan-100/75" />
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
              AI triage
            </span>
            <ArrowRight className="size-4 text-cyan-100/75" />
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
              Engineering-ready ticket
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
