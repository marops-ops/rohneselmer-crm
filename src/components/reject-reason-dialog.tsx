"use client";

import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { IKKE_AKTUELT_REASONS } from "@/lib/pipeline";

/**
 * Shared "why is this lead lost" prompt for the pipeline board's quick-move
 * paths (drag-and-drop onto "Tapte kunder" and the "Flytt til…" dropdown).
 * The guided per-stage flow (Ikke aktuelt / Kunde avslått tilbud) has its own
 * inline dialogs in stage-actions.tsx — this covers the shortcuts that used
 * to skip the reason entirely.
 */
export function RejectReasonDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  /** Fires when the dialog is dismissed (Escape / backdrop / no selection) without confirming. */
  onCancel?: () => void;
}) {
  const confirmedRef = useRef(false);

  useEffect(() => {
    if (open) confirmedRef.current = false;
  }, [open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && !confirmedRef.current) onCancel?.();
        onOpenChange(v);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hvorfor er leadet ikke aktuelt?</DialogTitle>
          <DialogDescription>Velg årsak. Leaden flyttes til Tapte kunder.</DialogDescription>
        </DialogHeader>
        <form
          action={(formData: FormData) => {
            confirmedRef.current = true;
            const reason = String(formData.get("reason") ?? IKKE_AKTUELT_REASONS[0]);
            onConfirm(reason);
            onOpenChange(false);
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="reject-reason">Årsak</Label>
            <Select name="reason" defaultValue={IKKE_AKTUELT_REASONS[0]}>
              <SelectTrigger id="reject-reason" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IKKE_AKTUELT_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" variant="destructive">
              Bekreft — avslutt lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
