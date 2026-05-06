import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-10 w-72 rounded-xl bg-white/10" />
        <Skeleton className="mt-3 h-5 w-96 rounded-xl bg-white/10" />
      </div>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-3xl bg-white/10" />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.55fr]">
        <Skeleton className="h-[360px] rounded-3xl bg-white/10" />
        <Skeleton className="h-[360px] rounded-3xl bg-white/10" />
      </section>

      <Skeleton className="h-[420px] rounded-3xl bg-white/10" />
    </div>
  );
}