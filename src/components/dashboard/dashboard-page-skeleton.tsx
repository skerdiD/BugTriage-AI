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
    <div className="space-y-8">
      <div>
        <Skeleton className={`h-10 ${titleWidth} rounded-xl bg-white/10`} />
        <Skeleton
          className={`mt-3 h-5 max-w-full ${descriptionWidth} rounded-xl bg-white/10`}
        />
      </div>

      {metricCount > 0 ? (
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: metricCount }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-3xl bg-white/10" />
          ))}
        </section>
      ) : null}

      {children}
    </div>
  );
}
