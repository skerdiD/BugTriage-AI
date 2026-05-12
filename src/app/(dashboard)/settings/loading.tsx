import { DashboardPageSkeleton } from "@/components/dashboard/dashboard-page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <DashboardPageSkeleton titleWidth="w-80" descriptionWidth="w-[520px]">
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Skeleton className="h-[520px] rounded-3xl bg-white/10" />
        <div className="space-y-5">
          <Skeleton className="h-[420px] rounded-3xl bg-white/10" />
          <Skeleton className="h-56 rounded-3xl bg-white/10" />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Skeleton className="h-[420px] rounded-3xl bg-white/10" />
        <Skeleton className="h-[300px] rounded-3xl bg-white/10" />
      </section>
    </DashboardPageSkeleton>
  );
}
