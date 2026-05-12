import { DashboardPageSkeleton } from "@/components/dashboard/dashboard-page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function TicketsLoading() {
  return (
    <DashboardPageSkeleton titleWidth="w-40" descriptionWidth="w-80">
      <Skeleton className="h-20 rounded-3xl bg-white/10" />
      <Skeleton className="h-12 w-full max-w-3xl rounded-2xl bg-white/10" />
      <Skeleton className="h-[520px] rounded-3xl bg-white/10" />
    </DashboardPageSkeleton>
  );
}
