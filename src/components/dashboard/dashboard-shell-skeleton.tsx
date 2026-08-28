import { AppLogoMark } from "@/components/brand/app-logo-mark";
import { DashboardPageSkeleton } from "@/components/dashboard/dashboard-page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

const navigationItems = Array.from({ length: 6 });

export function DashboardShellSkeleton() {
  return (
    <div
      className="min-h-dvh bg-[#08080d]"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-[#101017] lg:flex">
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
          <AppLogoMark className="size-10 rounded-xl" iconClassName="size-6" />
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold tracking-tight text-white">
              BugTriage AI
            </p>
            <p className="text-xs text-muted-foreground">From report to fix</p>
          </div>
        </div>

        <div className="flex-1 px-3 py-5">
          <Skeleton className="mb-4 ml-3 h-2.5 w-20" />
          <div className="space-y-2">
            {navigationItems.map((_, index) => (
              <div
                key={index}
                className="flex h-11 items-center gap-3 rounded-xl px-4"
              >
                <Skeleton className="size-8 shrink-0 rounded-xl" />
                <Skeleton
                  className={index % 2 === 0 ? "h-3 w-24" : "h-3 w-20"}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] px-2.5">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-[#08080d]/92 px-4 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-3">
          <AppLogoMark className="size-9 rounded-xl" iconClassName="size-6" />
          <div>
            <p className="font-bold leading-none">BugTriage AI</p>
            <p className="mt-1 text-xs text-muted-foreground">
              From report to fix
            </p>
          </div>
        </div>
        <Skeleton className="size-10 rounded-xl" />
      </header>

      <main id="main-content" className="min-h-screen lg:pl-64">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-7 flex justify-end lg:mb-8">
            <Skeleton className="h-[76px] w-full rounded-2xl sm:w-[460px]" />
          </div>

          <DashboardPageSkeleton
            titleWidth="w-72"
            descriptionWidth="w-96"
            metricCount={4}
          >
            <section className="grid gap-6 xl:grid-cols-[0.95fr_1.55fr]">
              <Skeleton className="h-[360px] rounded-3xl bg-white/10" />
              <Skeleton className="h-[360px] rounded-3xl bg-white/10" />
            </section>
          </DashboardPageSkeleton>
        </div>
      </main>
    </div>
  );
}
