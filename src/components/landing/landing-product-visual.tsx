import {
  ArrowRight,
  Bug,
  Camera,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const rawReportPoints = [
  "Customer says dashboard freezes after upload.",
  "Only seems to happen in Safari on iPhone.",
  "Screenshot attached, no clear reproduction steps.",
  "Support marked it urgent but engineering context is missing.",
];

const structuredFields = [
  { label: "Severity", value: "High" },
  { label: "Category", value: "File Upload" },
  { label: "Likely cause", value: "Safari image handling regression" },
  { label: "Priority", value: "Review today" },
];

export function LandingProductVisual() {
  return (
    <Card className="overflow-hidden rounded-[32px] border-white/10 bg-white/[0.04] py-0 shadow-[0_40px_120px_-60px_rgba(0,0,0,0.9)]">
      <CardContent className="p-0">
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/70 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-rose-400" />
            <span className="size-3 rounded-full bg-amber-300" />
            <span className="size-3 rounded-full bg-emerald-400" />
          </div>
          <Badge className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[0.68rem] text-cyan-100 uppercase">
            Before / after
          </Badge>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-[0.94fr_auto_1.06fr] lg:items-stretch">
          <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.22em] text-slate-500 uppercase">
                  Raw bug report
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  Messy incoming issue
                </h3>
              </div>
              <span className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <Bug className="size-5 text-amber-200" />
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {rawReportPoints.map((point) => (
                <div
                  key={point}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-slate-300"
                >
                  {point}
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="border-white/10 bg-white/[0.04] text-slate-200">
                <Camera className="size-3.5" />
                Screenshot
              </Badge>
              <Badge className="border-white/10 bg-white/[0.04] text-slate-200">
                <FileText className="size-3.5" />
                Logs
              </Badge>
            </div>
          </div>

          <div className="hidden items-center justify-center lg:flex">
            <div className="flex size-14 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 shadow-lg shadow-cyan-950/60">
              <ArrowRight className="size-5 text-cyan-100" />
            </div>
          </div>

          <div className="rounded-[28px] border border-cyan-400/18 bg-[linear-gradient(180deg,rgba(8,145,178,0.16),rgba(15,23,42,0.55))] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs tracking-[0.22em] text-cyan-100/70 uppercase">
                  Structured ticket
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  Engineering-ready output
                </h3>
              </div>
              <span className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08]">
                <Sparkles className="size-5 text-cyan-100" />
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {structuredFields.map((field) => (
                <div
                  key={field.label}
                  className="rounded-2xl border border-white/10 bg-slate-950/45 p-4"
                >
                  <p className="text-[0.68rem] tracking-[0.2em] text-slate-400 uppercase">
                    {field.label}
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">{field.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/55 p-4">
              <p className="text-[0.68rem] tracking-[0.2em] text-slate-400 uppercase">
                Reproduction steps
              </p>
              <div className="mt-3 space-y-2 text-sm leading-6 text-slate-200">
                <p>1. Open the dashboard on iPhone Safari.</p>
                <p>2. Upload a large screenshot in the bug form.</p>
                <p>3. Return to the dashboard and attempt to open the new ticket.</p>
                <p>4. Observe the UI freeze before the ticket panel resolves.</p>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-400/18 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-50">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <span>
                Suggested fix: verify Safari upload response handling, then check
                dashboard hydration after ticket creation.
              </span>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-300">
              <ShieldCheck className="size-4 text-emerald-200" />
              AI triage, secure uploads, and structured output in one workflow
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
