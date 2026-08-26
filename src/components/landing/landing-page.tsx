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
      className="relative min-h-screen overflow-hidden bg-[#07070c]"
    >
      <div className="pointer-events-none absolute inset-0 -z-30 bg-[#07070c]" />
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_50%_-8%,rgba(139,92,246,0.18),transparent_32rem),radial-gradient(circle_at_88%_18%,rgba(34,211,238,0.08),transparent_28rem)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[44rem] bg-[linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent)] opacity-25" />

      <LandingHeader />
      <HeroSection />
      <ProductPreview />
      <FeatureGrid features={features} />
      <FinalCta />

      <footer className="border-t border-white/[0.08] px-5 py-9 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 text-sm text-slate-500 md:flex-row md:items-end md:justify-between">
          <div className="max-w-md">
            <p className="font-semibold text-white">BugTriage AI</p>
            <p className="mt-2 leading-6 text-slate-400">
              A clearer handoff from customer signal to engineering action.
            </p>
            <p className="mt-3 text-xs text-slate-600">
              © {new Date().getFullYear()} BugTriage AI
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link href="#product-preview" className="transition hover:text-white">
              Product
            </Link>
            <Link href="#features" className="transition hover:text-white">
              Features
            </Link>
            <Link href="#workflow" className="transition hover:text-white">
              Workflow
            </Link>
            <Link href="/login" className="transition hover:text-white">
              Demo
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
