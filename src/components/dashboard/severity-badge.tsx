import { Badge } from "@/components/ui/badge";
import type { UiTicketSeverity as TicketSeverity } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

type SeverityBadgeProps = {
  severity: TicketSeverity;
};

const severityStyles: Record<TicketSeverity, string> = {
  Critical: "border-red-500/25 bg-red-500/15 text-red-300 shadow-red-500/10",
  High: "border-orange-500/25 bg-orange-500/15 text-orange-300 shadow-orange-500/10",
  Medium: "border-yellow-500/25 bg-yellow-500/15 text-yellow-300 shadow-yellow-500/10",
  Low: "border-sky-500/25 bg-sky-500/15 text-sky-300 shadow-sky-500/10",
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <Badge
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm",
        severityStyles[severity]
      )}
    >
      {severity}
    </Badge>
  );
}
