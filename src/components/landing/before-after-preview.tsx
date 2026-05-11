import {
  ArrowRight,
  Bug,
  Camera,
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
    <div className={`rounded-2xl border px-3.5 py-3 ${toneClass}`}>
      <p className="text-[0.63rem] tracking-[0.18em] uppercase text-current/70">
        {label}
      </p>
      <p className="mt-1.5 text-sm font-medium text-current">{value}</p>
    </div>
  );
}

export function BeforeAfterPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.14),transparent_35%),radial-gradient(circle_at_75%_80%,rgba(52,211,153,0.14),transparent_34%)] blur-2xl" />

      <Card className="overflow-hidden rounded-[30px] border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.94))] shadow-[0_36px_110px_-62px_rgba(0,0,0,0.98)]">
        <CardContent className="p-0">
          <div className="flex items-center justify-between border-b border-white/10 bg-black/18 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-rose-400" />
              <span className="size-2.5 rounded-full bg-amber-300" />
              <span className="size-2.5 rounded-full bg-emerald-400" />
            </div>
            <Badge className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[0.65rem] text-slate-200 uppercase">
              Product snapshot
            </Badge>
          </div>

          <div className="relative px-4 pb-4 pt-4">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.66rem] tracking-[0.18em] text-slate-500 uppercase">
                    Raw bug report
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    Checkout freezes on iPhone Safari
                  </h3>
                </div>
                <span className="flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                  <Bug className="size-4.5 text-amber-200" />
                </span>
              </div>

              <div className="mt-4 rounded-[22px] border border-white/10 bg-black/20 p-4">
                <p className="text-sm leading-6 text-slate-200">
                  Checkout freezes on iPhone Safari after entering card details.
                  User says payment form stops responding.
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {previewChips.slice(0, 4).map((chip) => (
                  <Badge
                    key={chip}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-200"
                  >
                    {chip}
                  </Badge>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-3.5">
                  <div className="flex items-center gap-2">
                    <Camera className="size-4 text-slate-300" />
                    <p className="text-sm font-medium text-white">Screenshot attached</p>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Frozen checkout state captured on mobile Safari.
                  </p>
                </div>

                <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-3.5">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 text-slate-300" />
                    <p className="text-sm font-medium text-white">Console log</p>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Client-side payment error captured during submission.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                Raw report
              </span>
              <ArrowRight className="size-3.5 text-cyan-100/75" />
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-cyan-100">
                AI triage
              </span>
              <ArrowRight className="size-3.5 text-cyan-100/75" />
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                Engineering-ready ticket
              </span>
            </div>

            <div className="mt-4 rounded-[28px] border border-cyan-400/18 bg-[linear-gradient(180deg,rgba(8,145,178,0.16),rgba(15,23,42,0.74))] p-4 shadow-[0_24px_70px_-48px_rgba(14,165,233,0.75)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.66rem] tracking-[0.18em] text-cyan-100/70 uppercase">
                    AI structured ticket
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-white">
                    Safari mobile checkout freezes after card entry
                  </h3>
                </div>
                <span className="flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08]">
                  <Sparkles className="size-4.5 text-cyan-100" />
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {previewMeta.map((item) => (
                  <PreviewMetaBadge key={item.label} {...item} />
                ))}
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-[22px] border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-[0.66rem] tracking-[0.18em] text-slate-400 uppercase">
                    Reproduction steps
                  </p>
                  <div className="mt-3 space-y-2.5">
                    {previewSteps.map((step, index) => (
                      <div
                        key={step}
                        className="flex items-start gap-3 text-sm leading-6 text-slate-200"
                      >
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/12 text-[0.68rem] font-semibold text-cyan-100">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
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
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-slate-300">
                <ShieldCheck className="size-4 text-emerald-200" />
                Severity, cause, and next action are clear before engineering picks it
                up.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
