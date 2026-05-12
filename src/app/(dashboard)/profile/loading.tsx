import { DashboardPageSkeleton } from "@/components/dashboard/dashboard-page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <DashboardPageSkeleton titleWidth="w-36" descriptionWidth="w-[420px]">
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Skeleton className="h-48 rounded-3xl bg-white/10" />
        <Skeleton className="h-80 rounded-3xl bg-white/10" />
      </section>
    </DashboardPageSkeleton>
  );
}
