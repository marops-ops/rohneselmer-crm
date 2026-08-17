"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CUSTOMER_LISTS, type CustomerListKey } from "./customer-lists";

export function CustomerListTabs({ active }: { active: CustomerListKey }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setList(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "alle") params.delete("list");
    else params.set("list", value);
    params.delete("q");
    router.replace(params.size ? `${pathname}?${params.toString()}` : pathname);
  }

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border p-1">
      {CUSTOMER_LISTS.map((l) => (
        <Button
          key={l.value}
          size="sm"
          variant="ghost"
          className={cn(
            "h-7",
            active === l.value ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"
          )}
          onClick={() => setList(l.value)}
        >
          {l.label}
        </Button>
      ))}
    </div>
  );
}
