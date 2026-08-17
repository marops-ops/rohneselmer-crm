"use client";

import { useActionState, useState } from "react";
import { createLead, updateLead } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Pencil, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BRANDS, MODELS_BY_BRAND, type VehicleBrand } from "@/lib/vehicles";

type Lead = {
  id: string;
  title: string;
  contactId: string | null;
  locationId: string;
  brand: string | null;
  model: string | null;
  value: string;
  source: string | null;
};

export function LeadFormSheet({
  lead,
  locations,
  contacts,
  defaultLocationId,
  defaultContactId,
  defaultOpen,
}: {
  lead?: Lead;
  locations: { id: string; name: string }[];
  contacts: { id: string; firstName: string; lastName: string | null }[];
  defaultLocationId?: string;
  defaultContactId?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const [brand, setBrand] = useState<string>(lead?.brand ?? "");
  const action = lead ? updateLead : createLead;
  const [state, formAction, pending] = useActionState(action, undefined);
  const isEdit = Boolean(lead);
  const models = brand && brand in MODELS_BY_BRAND ? MODELS_BY_BRAND[brand as VehicleBrand] : [];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant={isEdit ? "outline" : "default"} />}>
        {isEdit ? <Pencil className="size-4" /> : <Plus className="size-4" />}
        {isEdit ? "Rediger" : "Nytt lead"}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Rediger lead" : "Nytt lead"}</SheetTitle>
          <SheetDescription>
            {isEdit ? "Oppdater informasjon om leaden." : "Registrer et nytt lead manuelt."}
          </SheetDescription>
        </SheetHeader>
        <form action={formAction} className="flex flex-col gap-4 px-4">
          {isEdit ? <input type="hidden" name="id" value={lead!.id} /> : null}
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Tittel</Label>
            <Input
              id="title"
              name="title"
              placeholder="Genereres automatisk om tom"
              defaultValue={lead?.title}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="location">Lokasjon</Label>
            <Select
              name="locationId"
              defaultValue={lead?.locationId ?? defaultLocationId}
              required
            >
              <SelectTrigger id="location" className="w-full">
                <SelectValue placeholder="Velg lokasjon" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="brand">Merke</Label>
              <Select name="brand" value={brand} onValueChange={(v) => setBrand(v ?? "")}>
                <SelectTrigger id="brand" className="w-full">
                  <SelectValue placeholder="Velg merke" />
                </SelectTrigger>
                <SelectContent>
                  {BRANDS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="model">Modell</Label>
              <Select name="model" defaultValue={lead?.model ?? undefined} disabled={!brand}>
                <SelectTrigger id="model" className="w-full">
                  <SelectValue placeholder="Velg modell" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="contact">Kunde</Label>
            <Select name="contactId" defaultValue={lead?.contactId ?? defaultContactId ?? "none"}>
              <SelectTrigger id="contact" className="w-full">
                <SelectValue placeholder="Ingen kunde" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ingen kunde</SelectItem>
                {contacts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.firstName} {c.lastName ?? ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="value">Verdi (kr)</Label>
            <Input id="value" name="value" type="number" min="0" step="1" defaultValue={lead?.value ?? "0"} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="source">Kilde</Label>
            <Input
              id="source"
              name="source"
              placeholder="Nettside, Facebook Lead Ads, ..."
              defaultValue={lead?.source ?? ""}
            />
          </div>
          {state?.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <SheetFooter className="px-0">
            <Button type="submit" disabled={pending}>
              {pending ? "Lagrer…" : isEdit ? "Lagre endringer" : "Opprett lead"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
