import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";

type DashboardPageSkeletonProps = {
  titleWidth?: string;
  descriptionWidth?: string;
  metricCount?: number;
  children?: ReactNode;
};

export function DashboardPageSkeleton({
  titleWidth = "w-64",
  descriptionWidth = "w-96",
  metricCount = 0,
  children,
}: DashboardPageSkeletonProps) {
  return (
    <div className="space-y-7 lg:space-y-8">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <Skeleton className={`h-9 max-w-full ${titleWidth} rounded-xl bg-white/10`} />
          <Skeleton
            className={`mt-3 h-4 max-w-full ${descriptionWidth} rounded-xl bg-white/10`}
          />
        </div>
        <Skeleton className="hidden h-10 w-32 rounded-xl bg-white/10 sm:block" />
      </div>

      {metricCount > 0 ? (
        <section className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
          {Array.from({ length: metricCount }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-3xl bg-white/10" />
          ))}
        </section>
      ) : null}

      {children}
    </div>
  );
}
