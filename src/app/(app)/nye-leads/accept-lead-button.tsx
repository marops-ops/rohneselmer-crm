"use client";

import { useTransition } from "react";
import { acceptLead } from "../leads/actions";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export function AcceptLeadButton({ leadId }: { leadId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={(e) => {
        e.stopPropagation();
        startTransition(() => acceptLead(leadId));
      }}
    >
      <CheckCircle2 className="size-4" />
      Aksepter lead
    </Button>
  );
}
