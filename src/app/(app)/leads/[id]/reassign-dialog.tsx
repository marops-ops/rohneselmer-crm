"use client";

import { useState, useTransition } from "react";
import { reassignLead } from "../actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users } from "lucide-react";

export function ReassignDialog({
  leadId,
  sellers,
}: {
  leadId: string;
  sellers: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [sellerId, setSellerId] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Users className="size-4" />
        Omfordel lead
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Omfordel lead</DialogTitle>
          <DialogDescription>Velg hvilken selger leaden skal overføres til.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="seller">Selger</Label>
          <Select value={sellerId} onValueChange={(v) => setSellerId(v ?? "")}>
            <SelectTrigger id="seller" className="w-full">
              <SelectValue placeholder="Velg selger" />
            </SelectTrigger>
            <SelectContent>
              {sellers.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button
            disabled={!sellerId || pending}
            onClick={() => {
              const seller = sellers.find((s) => s.id === sellerId);
              if (!seller) return;
              startTransition(async () => {
                await reassignLead(leadId, seller.id, seller.name);
                setOpen(false);
              });
            }}
          >
            Bekreft omfordeling
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
