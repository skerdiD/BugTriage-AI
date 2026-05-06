import { Skeleton } from "@/components/ui/skeleton";

export default function TicketDetailLoading() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-4">
          <Skeleton className="h-10 w-36 rounded-xl bg-white/10" />
          <Skeleton className="h-8 w-80 rounded-xl bg-white/10" />
          <Skeleton className="h-12 w-[520px] max-w-full rounded-xl bg-white/10" />
        </div>

        <Skeleton className="h-32 w-full rounded-3xl bg-white/10 xl:max-w-sm" />
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.7fr]">
        <div className="space-y-6">
          <Skeleton className="h-56 rounded-3xl bg-white/10" />
          <Skeleton className="h-[520px] rounded-3xl bg-white/10" />
          <Skeleton className="h-64 rounded-3xl bg-white/10" />
        </div>

        <div className="space-y-6">
          <Skeleton className="h-96 rounded-3xl bg-white/10" />
          <Skeleton className="h-80 rounded-3xl bg-white/10" />
        </div>
      </section>
    </div>
  );
}