"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export function CompleteReminderButton({
  reminderId,
  leadId,
  action,
}: {
  reminderId: string;
  leadId: string;
  action: (id: string, leadId: string) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={pending}
      onClick={() => startTransition(() => action(reminderId, leadId))}
    >
      <Check className="size-4" />
    </Button>
  );
}
