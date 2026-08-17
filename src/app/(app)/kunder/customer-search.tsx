"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function CustomerSearch({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          startTransition(() => {
            router.replace(next ? `${pathname}?q=${encodeURIComponent(next)}` : pathname);
          });
        }}
        placeholder="Søk navn, telefon eller e-post…"
        className="pl-8"
      />
    </div>
  );
}
