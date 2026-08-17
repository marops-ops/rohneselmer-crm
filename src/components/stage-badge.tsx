import { Badge } from "@/components/ui/badge";
import { stageLabel, stageColor, STATUS_LABEL } from "@/lib/pipeline";
import { cn } from "@/lib/utils";

export function StageBadge({ stage }: { stage: string }) {
  const color = stageColor(stage);
  return (
    <Badge
      variant="outline"
      className="border"
      style={{
        backgroundColor: `color-mix(in oklch, ${color}, transparent 85%)`,
        color,
        borderColor: `color-mix(in oklch, ${color}, transparent 75%)`,
      }}
    >
      {stageLabel(stage)}
    </Badge>
  );
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-secondary text-secondary-foreground border-border",
  lost: "bg-red-500/15 text-red-400 border-red-500/20",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("border", STATUS_STYLES[status])}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}
