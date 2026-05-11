import {
  ArrowRight,
  Bug,
  Camera,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const contextChips = ["Safari", "iOS", "Checkout", "Payment"] as const;

const attachedContext = [
  {
    icon: Camera,
    label: "Screenshot attached",
    detail: "Frozen payment form state on iPhone Safari",
  },
  {
    icon: FileText,
    label: "Console log attached",
    detail: "Client-side error captured during card entry",
  },
] as const;

const structuredMeta = [
  { label: "Severity", value: "Critical", tone: "critical" },
  { label: "Category", value: "Payment / Checkout", tone: "default" },
  { label: "Confidence", value: "94%", tone: "default" },
  { label: "Status", value: "Triaged", tone: "success" },
] as const;

const reproductionSteps = [
  "Open checkout on iPhone Safari.",
  "Add card details to the payment form.",
  "Tap continue or submit payment.",
  "Observe the form freeze before completion.",
] as const;

const structuredSections = [
  {
    title: "Summary",
    body: "Checkout freezes on Safari mobile after card details are entered, blocking payment completion for affected users.",
  },
  {
    title: "Likely cause",
    body: "Safari-specific client-side handling in the payment form is likely failing after card input validation or tokenization.",
  },
  {
    title: "Suggested fix",
    body: "Review Safari payment form event handling, reproduce on iPhone, and harden the submit flow around card validation and async state updates.",
  },
] as const;

function MetaBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "critical" | "default" | "success";
}) {
  const toneClasses =
    tone === "critical"
      ? "border-rose-400/25 bg-rose-500/12 text-rose-100"
      : tone === "success"
        ? "border-emerald-400/25 bg-emerald-500/12 text-emerald-100"
        : "border-white/10 bg-white/[0.05] text-slate-100";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClasses}`}>
      <p className="text-[0.64rem] tracking-[0.2em] uppercase text-current/70">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-current">{value}</p>
    </div>
  );
}

export function BeforeAfterPreview() {
  return (
    <Card className="overflow-hidden rounded-[32px] border-white/10 bg-white/[0.04] py-0 shadow-[0_42px_120px_-58px_rgba(0,0,0,0.92)] transition-transform duration-300 hover:-translate-y-1">
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/72 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-rose-400" />
            <span className="size-3 rounded-full bg-amber-300" />
            <span className="size-3 rounded-full bg-emerald-400" />
          </div>
          <Badge className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[0.68rem] text-cyan-100 uppercase">
            Product preview
          </Badge>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-[0.94fr_auto_1.06fr] lg:items-stretch">
          <div className="rounded-[28px] border border-white/10 bg-slate-950/72 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.22em] text-slate-500 uppercase">
                  Messy bug report
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  Checkout freezes on Safari mobile
                </h3>
              </div>
              <span className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <Bug className="size-5 text-amber-200" />
              </span>
            </div>

            <div className="mt-5 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <p className="text-[0.68rem] tracking-[0.2em] text-slate-500 uppercase">
                User message
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                &quot;Customer says payment form freezes after adding card details. Only
                happens on iPhone Safari.&quot;
              </p>
            </div>

            <div className="mt-4">
              <p className="text-[0.68rem] tracking-[0.2em] text-slate-500 uppercase">
                Context
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {contextChips.map((chip) => (
                  <Badge
                    key={chip}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-slate-200"
                  >
                    {chip}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {attachedContext.map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 rounded-[22px] border border-white/8 bg-white/[0.03] p-4"
                >
                  <span className="mt-0.5 flex size-9 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                    <item.icon className="size-4 text-slate-200" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-[22px] border border-amber-400/18 bg-amber-500/10 p-4 text-sm leading-6 text-amber-50">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <span>Engineering still has to interpret severity, cause, and next steps.</span>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="hidden size-14 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 shadow-lg shadow-cyan-950/60 lg:flex">
              <ArrowRight className="size-5 text-cyan-100" />
            </div>
            <Badge className="border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-cyan-100 lg:hidden">
              AI triage
            </Badge>
          </div>

          <div className="rounded-[28px] border border-cyan-400/18 bg-[linear-gradient(180deg,rgba(8,145,178,0.18),rgba(15,23,42,0.62))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.22em] text-cyan-100/70 uppercase">
                  AI structured ticket
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  Engineering-ready ticket
                </h3>
              </div>
              <span className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08]">
                <Sparkles className="size-5 text-cyan-100" />
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {structuredMeta.map((item) => (
                <MetaBadge
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  tone={item.tone}
                />
              ))}
            </div>

            {structuredSections.map((section) => (
              <div
                key={section.title}
                className="mt-4 rounded-[24px] border border-white/10 bg-slate-950/55 p-4"
              >
                <p className="text-[0.68rem] tracking-[0.2em] text-slate-400 uppercase">
                  {section.title}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-200">{section.body}</p>
              </div>
            ))}

            <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-950/55 p-4">
              <p className="text-[0.68rem] tracking-[0.2em] text-slate-400 uppercase">
                Reproduction steps
              </p>
              <div className="mt-3 space-y-2">
                {reproductionSteps.map((step, index) => (
                  <div key={step} className="flex items-start gap-3 text-sm leading-6 text-slate-200">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/12 text-[0.7rem] font-semibold text-cyan-100">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-[22px] border border-emerald-400/18 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-50">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <span>Severity, summary, and next action are clear before engineering picks it up.</span>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-300">
              <ShieldCheck className="size-4 text-emerald-200" />
              Structured AI triage with private uploads and review-ready output
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
