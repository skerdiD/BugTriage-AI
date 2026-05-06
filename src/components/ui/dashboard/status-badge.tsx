import { Badge } from "@/components/ui/badge";
import type { TicketStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: TicketStatus;
};

const statusStyles: Record<TicketStatus, string> = {
  New: "border-violet-500/25 bg-violet-500/15 text-violet-300",
  Investigating: "border-sky-500/25 bg-sky-500/15 text-sky-300",
  "In Progress": "border-yellow-500/25 bg-yellow-500/15 text-yellow-300",
  Fixed: "border-emerald-500/25 bg-emerald-500/15 text-emerald-300",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-semibold",
        statusStyles[status]
      )}
    >
      {status}
    </Badge>
  );
}