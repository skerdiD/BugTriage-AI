import { DashboardPageSkeleton } from "@/components/dashboard/dashboard-page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <DashboardPageSkeleton
      titleWidth="w-72"
      descriptionWidth="w-96"
      metricCount={4}
    >
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.55fr]">
        <Skeleton className="h-[360px] rounded-3xl bg-white/10" />
        <Skeleton className="h-[360px] rounded-3xl bg-white/10" />
      </section>

      <Skeleton className="h-[420px] rounded-3xl bg-white/10" />
    </DashboardPageSkeleton>
  );
}
