import Link from "next/link";
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
import { Button } from "@/components/ui/button";
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
  { label: "Reviewer", value: "Engineering review", tone: "default" },
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
    body: "Safari mobile users can enter card details, but checkout freezes before payment completes.",
  },
  {
    title: "Likely cause",
    body: "Safari-specific payment form handling is likely failing after card validation or tokenization.",
  },
  {
    title: "Suggested fix",
    body: "Reproduce on iPhone Safari, inspect payment submit state transitions, and harden the post-validation flow.",
  },
] as const;

const workflowSteps = [
  "Raw report",
  "AI triage",
  "Engineering-ready ticket",
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
          <section
            aria-labelledby="messy-report-title"
            className="rounded-[28px] border border-white/10 bg-slate-950/72 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.22em] text-slate-500 uppercase">
                  Before
                </p>
                <h3
                  id="messy-report-title"
                  className="mt-2 text-xl font-semibold text-white"
                >
                  Checkout freezes on Safari mobile
                </h3>
              </div>
              <span className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <Bug className="size-5 text-amber-200" />
              </span>
            </div>

            <div className="mt-4 rounded-full border border-amber-400/16 bg-amber-500/8 px-3 py-1.5 text-xs text-amber-100">
              Missing priority and unclear next step
            </div>

            <div className="mt-4 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <p className="text-[0.68rem] tracking-[0.2em] text-slate-500 uppercase">
                Unclear user complaint
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-200">
                &quot;Customer says payment form freezes after adding card details. Only
                happens on iPhone Safari.&quot;
              </p>
            </div>

            <div className="mt-4">
              <p className="text-[0.68rem] tracking-[0.2em] text-slate-500 uppercase">
                Device and browser context
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

            <div className="mt-4 space-y-3">
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

            <div className="mt-4 flex items-start gap-3 rounded-[22px] border border-amber-400/18 bg-amber-500/10 p-4 text-sm leading-6 text-amber-50">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" />
              <span>Useful evidence is present, but engineering still has to translate it into a ticket.</span>
            </div>
          </section>

          <div className="flex items-center justify-center">
            <div className="hidden size-14 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 shadow-lg shadow-cyan-950/60 lg:flex">
              <ArrowRight className="size-5 text-cyan-100" />
            </div>
            <Badge className="border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-cyan-100 lg:hidden">
              AI triage
            </Badge>
          </div>

          <section
            aria-labelledby="structured-ticket-title"
            className="rounded-[28px] border border-cyan-400/18 bg-[linear-gradient(180deg,rgba(8,145,178,0.18),rgba(15,23,42,0.62))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.22em] text-cyan-100/70 uppercase">
                  After
                </p>
                <h3
                  id="structured-ticket-title"
                  className="mt-2 text-xl font-semibold text-white"
                >
                  Safari mobile checkout freezes after card entry
                </h3>
              </div>
              <span className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08]">
                <Sparkles className="size-5 text-cyan-100" />
              </span>
            </div>

            <div className="mt-4 rounded-full border border-emerald-400/16 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-100">
              Reviewed and ready for engineering triage
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {structuredMeta.map((item) => (
                <MetaBadge
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  tone={item.tone}
                />
              ))}
            </div>

            <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-950/55 p-4">
              <p className="text-[0.68rem] tracking-[0.2em] text-slate-400 uppercase">
                What the AI creates
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {structuredSections.map((section) => (
                  <div
                    key={section.title}
                    className="rounded-2xl border border-white/8 bg-white/[0.03] p-3.5"
                  >
                    <p className="text-[0.68rem] tracking-[0.2em] text-slate-400 uppercase">
                      {section.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">
                      {section.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>

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
              <span>Severity, summary, likely cause, and next action are clear before engineering picks it up.</span>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-300">
              <ShieldCheck className="size-4 text-emerald-200" />
              Structured AI triage with private uploads and review-ready output
            </div>
          </section>
        </div>

        <div className="border-t border-white/10 bg-slate-950/42 px-5 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-200">
                {workflowSteps.map((step, index) => (
                  <div key={step} className="flex items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
                      {step}
                    </span>
                    {index < workflowSteps.length - 1 ? (
                      <ArrowRight className="size-4 text-cyan-100/70" />
                    ) : null}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-sm text-slate-400">
                Raw report {"\u2192"} AI triage {"\u2192"} Engineering-ready ticket
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                asChild
                size="sm"
                className="h-10 rounded-full bg-[linear-gradient(135deg,#0891b2,#10b981)] px-5 text-white shadow-lg shadow-cyan-950/60 hover:brightness-110"
              >
                <Link href="/submit-bug">Submit Demo Bug</Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-10 rounded-full border-white/10 bg-white/[0.04] px-5 text-white hover:bg-white/[0.08]"
              >
                <Link href="/dashboard">Open Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
