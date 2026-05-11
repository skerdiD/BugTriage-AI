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
    <div className={`rounded-2xl border px-3 py-2.5 ${toneClass}`}>
      <p className="text-[0.6rem] tracking-[0.18em] uppercase text-current/70">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-current">{value}</p>
    </div>
  );
}

export function BeforeAfterPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[460px] lg:ml-auto">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_16%_18%,rgba(34,211,238,0.14),transparent_32%),radial-gradient(circle_at_80%_86%,rgba(59,130,246,0.12),transparent_34%)] blur-2xl" />

      <Card className="overflow-hidden rounded-[28px] border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.94))] shadow-[0_32px_100px_-60px_rgba(0,0,0,0.98)]">
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

          <div className="space-y-3 px-4 py-4 sm:px-5 sm:py-5">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.64rem] tracking-[0.18em] text-slate-500 uppercase">
                    Raw bug report
                  </p>
                  <h3 className="mt-2 text-base font-semibold text-white">
                    Checkout freezes on iPhone Safari
                  </h3>
                </div>
                <span className="flex size-9 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                  <Bug className="size-4 text-amber-200" />
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-200">
                Checkout freezes on iPhone Safari after entering card details. User
                says payment form stops responding.
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {previewChips.slice(0, 4).map((chip) => (
                  <Badge
                    key={chip}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[0.72rem] text-slate-200"
                  >
                    {chip}
                  </Badge>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.72rem] text-slate-300">
                  <Camera className="size-3.5 text-slate-200" />
                  Screenshot attached
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.72rem] text-slate-300">
                  <FileText className="size-3.5 text-slate-200" />
                  Console log
                </span>
              </div>
            </div>

            <div className="mx-auto flex max-w-max items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[0.72rem] text-slate-300">
              <span>Raw report</span>
              <ArrowRight className="size-3.5 text-cyan-100/75" />
              <span className="text-cyan-100">AI triage</span>
              <ArrowRight className="size-3.5 text-cyan-100/75" />
              <span>Engineering-ready ticket</span>
            </div>

            <div className="ml-auto w-[92%] rounded-[26px] border border-cyan-400/18 bg-[linear-gradient(180deg,rgba(8,145,178,0.16),rgba(15,23,42,0.82))] p-4 shadow-[0_24px_80px_-52px_rgba(14,165,233,0.75)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.64rem] tracking-[0.18em] text-cyan-100/70 uppercase">
                    AI structured ticket
                  </p>
                  <h3 className="mt-2 text-base font-semibold text-white">
                    Safari mobile checkout freezes after card entry
                  </h3>
                </div>
                <span className="flex size-9 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08]">
                  <Sparkles className="size-4 text-cyan-100" />
                </span>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {previewMeta.map((item) => (
                  <PreviewMetaBadge key={item.label} {...item} />
                ))}
              </div>

              <div className="mt-3 rounded-[20px] border border-white/10 bg-slate-950/45 p-3.5">
                <p className="text-[0.64rem] tracking-[0.18em] text-slate-400 uppercase">
                  Reproduction steps
                </p>
                <div className="mt-2 space-y-2">
                  {previewSteps.slice(0, 2).map((step, index) => (
                    <div
                      key={step}
                      className="flex items-start gap-2.5 text-sm leading-6 text-slate-200"
                    >
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/12 text-[0.65rem] font-semibold text-cyan-100">
                        {index + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {previewStructuredSections.map((section) => (
                  <div
                    key={section.title}
                    className="rounded-[20px] border border-white/10 bg-white/[0.04] p-3.5"
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

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-300">
                <ShieldCheck className="size-4 text-emerald-200" />
                Reviewer ready. Status is triaged before engineering picks it up.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
