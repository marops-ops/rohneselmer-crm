"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

export function LocationPicker({
  locations,
  selectedIds,
}: {
  locations: { id: string; name: string }[];
  selectedIds: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function toggle(id: string) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((s) => s !== id)
      : [...selectedIds, id];
    const params = new URLSearchParams(searchParams.toString());
    if (next.length === 0 || next.length === locations.length) {
      params.delete("locations");
    } else {
      params.set("locations", next.join(","));
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  const allSelected = selectedIds.length === 0 || selectedIds.length === locations.length;

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>
        <MapPin className="size-4" />
        Lokasjoner
        {!allSelected ? <Badge variant="secondary">{selectedIds.length}</Badge> : null}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <div className="flex flex-col gap-2">
          {locations.map((loc) => {
            const checked = allSelected || selectedIds.includes(loc.id);
            return (
              <Label
                key={loc.id}
                className="flex items-center gap-2 rounded-md p-1.5 text-sm hover:bg-secondary"
              >
                <Checkbox checked={checked} onCheckedChange={() => toggle(loc.id)} />
                {loc.name}
              </Label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
