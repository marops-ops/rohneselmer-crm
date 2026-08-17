"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { setPassword } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

function SettPassordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, formAction, pending] = useActionState(setPassword, undefined);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Sett ditt passord</CardTitle>
        <CardDescription>Velkommen til RøhneSelmer LMS. Velg et passord for kontoen din.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="token" value={token} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Nytt passord</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoFocus
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Bekreft passord</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          {!token ? (
            <Alert variant="destructive">
              <AlertDescription>
                Mangler invitasjonstoken i lenken. Sjekk at du brukte hele lenken fra e-posten.
              </AlertDescription>
            </Alert>
          ) : null}
          {state?.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending || !token}>
            {pending ? "Lagrer…" : "Sett passord og logg inn"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function SettPassordPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <Suspense fallback={null}>
        <SettPassordForm />
      </Suspense>
    </div>
  );
}
