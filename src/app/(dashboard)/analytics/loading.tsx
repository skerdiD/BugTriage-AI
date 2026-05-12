import { DashboardPageSkeleton } from "@/components/dashboard/dashboard-page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <DashboardPageSkeleton
      titleWidth="w-80"
      descriptionWidth="w-[520px]"
      metricCount={4}
    >
      <Skeleton className="h-[350px] rounded-3xl bg-white/10" />

      <section className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-[340px] rounded-3xl bg-white/10" />
        <Skeleton className="h-[340px] rounded-3xl bg-white/10" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Skeleton className="h-80 rounded-3xl bg-white/10" />
        <Skeleton className="h-80 rounded-3xl bg-white/10" />
      </section>
    </DashboardPageSkeleton>
  );
}
