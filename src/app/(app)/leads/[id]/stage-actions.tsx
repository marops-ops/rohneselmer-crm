"use client";

import { useState, useTransition } from "react";
import {
  acceptLead,
  markIkkeAktuelt,
  markTilbudGitt,
  markProvekjoringBooket,
  markKontraktSkrevet,
  markKundeAvslattTilbud,
  markBilLevertJa,
  markBilLevertNei,
  markFerdig,
  reopenLead,
} from "../actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IKKE_AKTUELT_REASONS, KUNDE_AVSLATT_REASONS, BRAND_HINTS } from "@/lib/pipeline";
import { CheckCircle2, XCircle, Car, FileSignature, RotateCcw } from "lucide-react";

type Props = {
  leadId: string;
  stage: string;
  status: string;
  brand: string | null;
};

export function StageActions({ leadId, stage, status, brand }: Props) {
  const [pending, startTransition] = useTransition();

  if (status === "lost") {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => reopenLead(leadId))}
      >
        <RotateCcw className="size-4" />
        Gjenåpne
      </Button>
    );
  }

  if (stage === "nye") {
    return (
      <Button disabled={pending} onClick={() => startTransition(() => acceptLead(leadId))}>
        <CheckCircle2 className="size-4" />
        Aksepter lead
      </Button>
    );
  }

  if (stage === "under_arbeid") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <IkkeAktueltDialog leadId={leadId} />
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => startTransition(() => markTilbudGitt(leadId))}
        >
          <FileSignature className="size-4" />
          Tilbud gitt
        </Button>
        <ProvekjoringDialog leadId={leadId} brand={brand} />
      </div>
    );
  }

  if (stage === "for_oppfolging") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <KontraktSkrevetDialog leadId={leadId} />
        <KundeAvslattDialog leadId={leadId} />
      </div>
    );
  }

  if (stage === "kunde_vunnet") {
    return <ErBilenLevertDialog leadId={leadId} />;
  }

  if (stage === "bil_levert") {
    return (
      <Button disabled={pending} onClick={() => startTransition(() => markFerdig(leadId))}>
        <CheckCircle2 className="size-4" />
        Registrer oppfølging
      </Button>
    );
  }

  return null;
}

function IkkeAktueltDialog({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="border-red-500/30 text-red-500 hover:bg-red-500/10"
          />
        }
      >
        <XCircle className="size-4" />
        Ikke aktuelt
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ikke aktuelt</DialogTitle>
          <DialogDescription>Velg årsak. Leaden flyttes til Tapte kunder.</DialogDescription>
        </DialogHeader>
        <form
          action={async (formData: FormData) => {
            await markIkkeAktuelt(leadId, formData);
            setOpen(false);
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="reason">Årsak</Label>
            <Select name="reason" defaultValue={IKKE_AKTUELT_REASONS[0]}>
              <SelectTrigger id="reason" className="w-full">
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
              Bekreft
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProvekjoringDialog({ leadId, brand }: { leadId: string; brand: string | null }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const hint = brand ? BRAND_HINTS[brand] : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Car className="size-4" />
        Prøvekjøring booket
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>HUSK</DialogTitle>
        </DialogHeader>
        <Alert>
          <AlertTitle>Før du fortsetter</AlertTitle>
          <AlertDescription>
            {hint ?? "Følg lokasjonens rutine for booking av prøvekjøring."}
          </AlertDescription>
        </Alert>
        <DialogFooter>
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await markProvekjoringBooket(leadId);
                setOpen(false);
              })
            }
          >
            Bekreft booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KontraktSkrevetDialog({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
          />
        }
      >
        <FileSignature className="size-4" />
        Kontrakt skrevet
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kontrakt skrevet</DialogTitle>
          <DialogDescription>Angi forventet utleveringsdato.</DialogDescription>
        </DialogHeader>
        <form
          action={async (formData: FormData) => {
            const result = await markKontraktSkrevet(leadId, formData);
            if (result?.error) setError(result.error);
            else setOpen(false);
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="expectedDeliveryDate">Forventet utleveringsdato</Label>
            <Input id="expectedDeliveryDate" name="expectedDeliveryDate" type="date" required />
          </div>
          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button type="submit">Bekreft</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function KundeAvslattDialog({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="border-red-500/30 text-red-500 hover:bg-red-500/10"
          />
        }
      >
        <XCircle className="size-4" />
        Kunde avslått tilbud
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kunde avslått tilbud</DialogTitle>
          <DialogDescription>Velg årsak. Leaden flyttes til Tapte kunder.</DialogDescription>
        </DialogHeader>
        <form
          action={async (formData: FormData) => {
            await markKundeAvslattTilbud(leadId, formData);
            setOpen(false);
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="reason">Årsak</Label>
            <Select name="reason" defaultValue={KUNDE_AVSLATT_REASONS[0]}>
              <SelectTrigger id="reason" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KUNDE_AVSLATT_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" variant="destructive">
              Bekreft
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ErBilenLevertDialog({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState(false);
  const [showNeiForm, setShowNeiForm] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setShowNeiForm(false);
      }}
    >
      <DialogTrigger render={<Button />}>
        <Car className="size-4" />
        Er bilen levert?
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Er bilen levert?</DialogTitle>
        </DialogHeader>
        {!showNeiForm ? (
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNeiForm(true)}>
              Nei
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await markBilLevertJa(leadId);
                  setOpen(false);
                })
              }
            >
              Ja
            </Button>
          </DialogFooter>
        ) : (
          <form
            action={async (formData: FormData) => {
              const result = await markBilLevertNei(leadId, formData);
              if (result?.error) setError(result.error);
              else setOpen(false);
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="expectedDeliveryDate">Velg ny utleveringsdato</Label>
              <Input id="expectedDeliveryDate" name="expectedDeliveryDate" type="date" required />
            </div>
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
            <DialogFooter>
              <Button type="submit">Lagre ny dato</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
