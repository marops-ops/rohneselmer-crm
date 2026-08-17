import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SlaInfo } from "@/lib/sla";

const STATE_CLASS: Record<string, string> = {
  green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  yellow: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  red: "border-red-500/30 bg-red-500/10 text-red-500",
  done: "border-border bg-secondary text-secondary-foreground",
  inactive: "border-border text-muted-foreground",
};

export function SlaBadge({ label, sla }: { label: string; sla: SlaInfo }) {
  return (
    <Badge variant="outline" className={cn("gap-1.5 border", STATE_CLASS[sla.state])}>
      <span className="font-medium">{label}:</span>
      {sla.label}
    </Badge>
  );
}
