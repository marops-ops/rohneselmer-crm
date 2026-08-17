"use client";

import { useActionState, useState } from "react";
import { createLocation } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function LocationFormSheet() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    async (prev: { error?: string } | undefined, formData: FormData) => {
      const result = await createLocation(prev, formData);
      if (!result?.error) setOpen(false);
      return result;
    },
    undefined
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm" />}>
        <Plus className="size-4" />
        Ny lokasjon
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Ny lokasjon</SheetTitle>
        </SheetHeader>
        <form action={formAction} className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Navn</Label>
            <Input id="name" name="name" required placeholder="F.eks. Alnabru (Oslo)" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address">Adresse</Label>
            <Input id="address" name="address" placeholder="F.eks. Strømsveien 183" />
          </div>
          {state?.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <SheetFooter className="px-0">
            <Button type="submit" disabled={pending}>
              {pending ? "Lagrer…" : "Opprett lokasjon"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
