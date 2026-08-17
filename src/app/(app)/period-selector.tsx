"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const PERIODS = [
  { value: "month", label: "Denne måneden" },
  { value: "quarter", label: "Kvartal" },
  { value: "year", label: "I år" },
  { value: "custom", label: "Egendefinert" },
];

export function PeriodSelector({
  period,
  from,
  to,
}: {
  period: string;
  from?: string;
  to?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setPeriod(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    if (value !== "custom") {
      params.delete("from");
      params.delete("to");
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  function setCustomDate(key: "from" | "to", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", "custom");
    params.set(key, value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-lg border border-border p-1">
        {PERIODS.map((p) => (
          <Button
            key={p.value}
            size="sm"
            variant="ghost"
            className={cn(
              "h-7",
              period === p.value ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"
            )}
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>
      {period === "custom" ? (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            className="h-8 w-36"
            defaultValue={from}
            onChange={(e) => setCustomDate("from", e.target.value)}
          />
          <span className="text-sm text-muted-foreground">til</span>
          <Input
            type="date"
            className="h-8 w-36"
            defaultValue={to}
            onChange={(e) => setCustomDate("to", e.target.value)}
          />
        </div>
      ) : null}
    </div>
  );
}
