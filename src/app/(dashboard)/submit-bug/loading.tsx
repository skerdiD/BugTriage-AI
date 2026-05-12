import { DashboardPageSkeleton } from "@/components/dashboard/dashboard-page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function SubmitBugLoading() {
  return (
    <DashboardPageSkeleton titleWidth="w-80" descriptionWidth="w-[560px]">
      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.75fr]">
        <Skeleton className="h-[760px] rounded-3xl bg-white/10" />
        <div className="space-y-6">
          <Skeleton className="h-80 rounded-3xl bg-white/10" />
          <Skeleton className="h-56 rounded-3xl bg-white/10" />
        </div>
      </section>
    </DashboardPageSkeleton>
  );
}
