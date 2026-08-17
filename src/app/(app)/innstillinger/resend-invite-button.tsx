"use client";

import { useTransition } from "react";
import { resendInvite } from "./actions";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export function ResendInviteButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => resendInvite(userId))}
    >
      <Mail className="size-4" />
      {pending ? "Sender…" : "Send invitasjon på nytt"}
    </Button>
  );
}
