import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="render-deferred px-5 py-12 sm:px-6 md:py-16">
      <div className="mx-auto max-w-6xl rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(34,211,238,0.1),rgba(15,23,42,0.9))] p-7 shadow-[0_36px_120px_-78px_rgba(0,0,0,0.98)] md:p-10">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.22em] text-cyan-100/85 uppercase">
              No pitch deck required
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              See the complete workflow with real sample data.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              Open the read-only demo, follow a report from intake to resolution,
              and inspect the actual dashboard. No setup or account required.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 w-full rounded-full bg-white px-7 text-sm font-semibold text-slate-950 transition active:scale-[0.98] hover:bg-cyan-50 sm:w-auto"
            >
              <Link href="/login" aria-label="Open the BugTriage AI live demo">
                Open live demo
                <ArrowRight className="size-4" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 w-full rounded-full border-white/15 bg-white/[0.045] px-7 text-sm text-white transition active:scale-[0.98] hover:bg-white/[0.09] sm:w-auto"
            >
              <Link href="/signup" aria-label="Create a BugTriage AI account">
                Create your workspace
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
