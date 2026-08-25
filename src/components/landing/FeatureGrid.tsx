import { securityItems, workflowSteps } from "@/components/landing/landing-data";
import type { FeatureCard } from "@/components/landing/landing-data";

export function FeatureGrid({ features }: { features: FeatureCard[] }) {
  return (
    <>
      <section
        id="features"
        className="render-deferred scroll-mt-24 px-5 py-12 sm:px-6 md:py-16"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-medium tracking-[0.22em] text-cyan-100/75 uppercase">
              Built for the handoff
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Keep the report, evidence, and next steps together.
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              One place for support and QA to share what happened, and for
              engineering to decide what happens next.
            </p>
          </div>

          <div className="mt-9 grid gap-4 md:grid-cols-2">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="landing-fade-up rounded-[26px] border border-white/10 bg-white/[0.035] p-6 shadow-[0_28px_80px_-62px_rgba(0,0,0,0.95)] transition duration-300 hover:-translate-y-1 hover:border-white/16 hover:bg-white/[0.05] md:min-h-48"
                style={{ animationDelay: `${index * 70}ms` }}
              >
                <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.055]">
                  <feature.icon className="size-5 text-cyan-100" />
                </div>
                <h3 className="mt-5 text-xl font-semibold tracking-tight text-white">
                  {feature.title}
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="workflow"
        className="render-deferred scroll-mt-24 px-5 py-10 sm:px-6 md:py-14"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-xs font-medium tracking-[0.22em] text-cyan-100/75 uppercase">
                Workflow
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-4xl">
                From report to next step.
              </h2>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {workflowSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="landing-fade-up rounded-[22px] border border-white/10 bg-white/[0.03] p-5"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-cyan-300/10 text-sm font-semibold text-cyan-100">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-white">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-3 rounded-[26px] border border-white/10 bg-white/[0.03] p-3 md:grid-cols-4">
            {securityItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 rounded-[18px] bg-slate-950/35 px-4 py-3 text-sm text-slate-200"
              >
                <item.icon className="size-4 text-emerald-200" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
