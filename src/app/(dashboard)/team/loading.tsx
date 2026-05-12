import { DashboardPageSkeleton } from "@/components/dashboard/dashboard-page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function TeamLoading() {
  return (
    <DashboardPageSkeleton titleWidth="w-52" descriptionWidth="w-[520px]">
      <section className="grid gap-5 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-32 rounded-3xl bg-white/10" />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Skeleton className="h-[420px] rounded-3xl bg-white/10" />
        <Skeleton className="h-[420px] rounded-3xl bg-white/10" />
      </section>
    </DashboardPageSkeleton>
  );
}
