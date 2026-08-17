"use client";

import { useActionState, useState } from "react";
import { createContact, updateContact } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Pencil, Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type Contact = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

export function ContactFormSheet({
  contact,
  defaultOpen,
  leadId,
  triggerLabel,
  triggerSize,
}: {
  contact?: Contact;
  defaultOpen?: boolean;
  leadId?: string;
  triggerLabel?: string;
  triggerSize?: "default" | "sm";
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  const action = contact ? updateContact : createContact;
  const [state, formAction, pending] = useActionState(action, undefined);
  const isEdit = Boolean(contact);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant={isEdit ? "outline" : "default"} size={triggerSize ?? "default"} />}
      >
        {isEdit ? <Pencil className="size-4" /> : <Plus className="size-4" />}
        {isEdit ? "Rediger" : (triggerLabel ?? "Ny kunde")}
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Rediger kunde" : "Ny kunde"}</SheetTitle>
          <SheetDescription>
            {isEdit ? "Oppdater kundeinformasjon." : "Legg til et kundekort."}
          </SheetDescription>
        </SheetHeader>
        <form action={formAction} className="flex flex-col gap-4 px-4">
          {isEdit ? <input type="hidden" name="id" value={contact!.id} /> : null}
          {!isEdit && leadId ? <input type="hidden" name="leadId" value={leadId} /> : null}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="firstName">Fornavn</Label>
              <Input id="firstName" name="firstName" required defaultValue={contact?.firstName} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="lastName">Etternavn</Label>
              <Input id="lastName" name="lastName" defaultValue={contact?.lastName ?? ""} />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-post</Label>
            <Input id="email" name="email" type="email" defaultValue={contact?.email ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input id="phone" name="phone" defaultValue={contact?.phone ?? ""} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="notes">Notater</Label>
            <Textarea id="notes" name="notes" rows={4} defaultValue={contact?.notes ?? ""} />
          </div>
          {state?.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <SheetFooter className="px-0">
            <Button type="submit" disabled={pending}>
              {pending ? "Lagrer…" : isEdit ? "Lagre endringer" : "Opprett kunde"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
