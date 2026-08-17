"use client";

import { useState, useTransition } from "react";
import { changeLeadStage, rejectLead } from "../leads/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RejectReasonDialog } from "@/components/reject-reason-dialog";
import { STAGES, type Stage } from "@/lib/pipeline";
import { ChevronDown } from "lucide-react";

export function MoveLeadControl({ leadId, stage }: { leadId: string; stage: string }) {
  const [pending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" disabled={pending} />}>
          Flytt til…
          <ChevronDown className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {STAGES.map((s) => (
            <DropdownMenuItem
              key={s.value}
              disabled={s.value === stage}
              onClick={() => startTransition(() => changeLeadStage(leadId, s.value as Stage))}
            >
              {s.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setShowReject(true)}>
            Tapte kunder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <RejectReasonDialog
        open={showReject}
        onOpenChange={setShowReject}
        onConfirm={(reason) => startTransition(() => rejectLead(leadId, reason))}
      />
    </>
  );
}
