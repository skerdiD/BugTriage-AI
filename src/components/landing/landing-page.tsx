import Link from "next/link";

import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { FinalCta } from "@/components/landing/FinalCta";
import { HeroSection } from "@/components/landing/HeroSection";
import { features } from "@/components/landing/landing-data";
import { LandingHeader } from "@/components/landing/landing-header";
import { ProductPreview } from "@/components/landing/ProductPreview";

export function LandingPage() {
  return (
    <main
      id="main-content"
      className="relative min-h-screen overflow-hidden bg-[#05060b]"
    >
      <div className="pointer-events-none absolute inset-0 -z-30 bg-[#05060b]" />
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.16),transparent_30rem),radial-gradient(circle_at_18%_14%,rgba(139,92,246,0.13),transparent_22rem),radial-gradient(circle_at_82%_22%,rgba(16,185,129,0.1),transparent_24rem)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:88px_88px] [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-30" />

      <LandingHeader />
      <HeroSection />
      <ProductPreview />
      <FeatureGrid features={features} />
      <FinalCta />

      <footer className="border-t border-white/10 px-5 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold tracking-[0.18em] text-white/70 uppercase">
              BugTriage AI
            </p>
            <p className="mt-2 text-slate-400">
              Built for the awkward handoff between the person who saw the bug and
              the person fixing it.
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link href="#product-preview" className="transition hover:text-white">
              Example ticket
            </Link>
            <Link href="/login" className="transition hover:text-white">
              Sample queue
            </Link>
            <Link href="/login" className="transition hover:text-white">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
