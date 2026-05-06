import { Skeleton } from "@/components/ui/skeleton";

export default function TicketsLoading() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-10 w-40 rounded-xl bg-white/10" />
        <Skeleton className="mt-3 h-5 w-80 rounded-xl bg-white/10" />
      </div>

      <Skeleton className="h-20 rounded-3xl bg-white/10" />
      <Skeleton className="h-12 w-full max-w-3xl rounded-2xl bg-white/10" />
      <Skeleton className="h-[520px] rounded-3xl bg-white/10" />
    </div>
  );
}