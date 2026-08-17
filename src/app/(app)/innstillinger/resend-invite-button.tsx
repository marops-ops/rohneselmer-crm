"use client";

import { useTransition } from "react";
import { toast } from "sonner";
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
      onClick={() =>
        startTransition(async () => {
          const result = await resendInvite(userId);
          if (result?.error) toast.error(result.error);
          else toast.success("Invitasjon sendt på nytt.");
        })
      }
    >
      <Mail className="size-4" />
      {pending ? "Sender…" : "Send invitasjon på nytt"}
    </Button>
  );
}
