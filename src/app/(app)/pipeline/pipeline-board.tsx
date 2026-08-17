"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { STAGES, type Stage } from "@/lib/pipeline";
import { formatCurrency, initials } from "@/lib/format";
import { MoveLeadControl } from "./move-lead-control";
import { changeLeadStage, rejectLead } from "../leads/actions";
import { RejectReasonDialog } from "@/components/reject-reason-dialog";
import { MapPin, Ban } from "lucide-react";

const TAPTE_KUNDER = "tapte_kunder";

type PipelineLead = {
  id: string;
  title: string;
  stage: string;
  status: string;
  value: string;
  brand: string | null;
  sellerName: string | null;
  locationName: string | null;
};

function groupByColumn(leads: PipelineLead[]) {
  const groups: Record<string, PipelineLead[]> = { [TAPTE_KUNDER]: [] };
  for (const stage of STAGES) groups[stage.value] = [];
  for (const lead of leads) {
    if (lead.status === "lost") groups[TAPTE_KUNDER].push(lead);
    else groups[lead.stage]?.push(lead);
  }
  return groups;
}

export function PipelineBoard({ leads }: { leads: PipelineLead[] }) {
  const [columns, setColumns] = useState(() => groupByColumn(leads));
  const [activeLead, setActiveLead] = useState<PipelineLead | null>(null);
  const [pendingReject, setPendingReject] = useState<{
    leadId: string;
    previousStage: string;
  } | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setColumns(groupByColumn(leads));
  }, [leads]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function moveCard(leadId: string, targetCol: string, patch: Partial<PipelineLead>) {
    setColumns((prev) => {
      let moving: PipelineLead | undefined;
      const next: Record<string, PipelineLead[]> = {};
      for (const [col, items] of Object.entries(prev)) {
        next[col] = items.filter((l) => {
          if (l.id === leadId) {
            moving = l;
            return false;
          }
          return true;
        });
      }
      if (!moving) return prev;
      const updated = { ...moving, ...patch };
      next[targetCol] = [updated, ...(next[targetCol] ?? [])];
      return next;
    });
  }

  function handleDragStart(event: DragStartEvent) {
    const lead = leads.find((l) => l.id === event.active.id);
    setActiveLead(lead ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveLead(null);
    const { active, over } = event;
    if (!over) return;
    const leadId = String(active.id);
    const target = String(over.id);

    const current = leads.find((l) => l.id === leadId);
    if (!current) return;
    const alreadyThere =
      target === TAPTE_KUNDER ? current.status === "lost" : current.stage === target;
    if (alreadyThere) return;

    if (target === TAPTE_KUNDER) {
      // Optimistically show the card in "Tapte kunder", but hold off on the
      // server call until a reason is confirmed — cancelling reverts this.
      moveCard(leadId, TAPTE_KUNDER, { status: "lost" });
      setPendingReject({ leadId, previousStage: current.stage });
      return;
    }

    moveCard(leadId, target, { stage: target, status: "active" });
    startTransition(() => {
      changeLeadStage(leadId, target as Stage);
    });
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-7">
        {STAGES.map((stage) => (
          <PipelineColumn
            key={stage.value}
            columnId={stage.value}
            label={stage.label}
            leads={columns[stage.value] ?? []}
          />
        ))}
        <PipelineColumn
          columnId={TAPTE_KUNDER}
          label="Tapte kunder"
          leads={columns[TAPTE_KUNDER] ?? []}
          muted
        />
      </div>
      <DragOverlay>
        {activeLead ? <PipelineCardBody lead={activeLead} dragging /> : null}
      </DragOverlay>
      {pendingReject ? (
        <RejectReasonDialog
          open
          onOpenChange={(open) => {
            if (!open) setPendingReject(null);
          }}
          onConfirm={(reason) => {
            startTransition(() => rejectLead(pendingReject.leadId, reason));
            setPendingReject(null);
          }}
          onCancel={() => {
            moveCard(pendingReject.leadId, pendingReject.previousStage, {
              stage: pendingReject.previousStage,
              status: "active",
            });
          }}
        />
      ) : null}
    </DndContext>
  );
}

function PipelineColumn({
  columnId,
  label,
  leads,
  muted,
}: {
  columnId: string;
  label: string;
  leads: PipelineLead[];
  muted?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });
  const total = leads.reduce((sum, l) => sum + Number(l.value), 0);

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between px-0.5">
        <h2 className={`flex items-center gap-1.5 text-sm font-semibold ${muted ? "text-muted-foreground" : ""}`}>
          {muted ? <Ban className="size-3.5" /> : null}
          {label}
        </h2>
        <Badge variant="outline" className="text-xs">
          {leads.length}
        </Badge>
      </div>
      <p className="-mt-2 px-0.5 text-xs text-muted-foreground">{formatCurrency(total)}</p>
      <div
        ref={setNodeRef}
        className={`flex min-h-24 flex-col gap-2.5 rounded-lg transition-colors ${
          isOver ? (muted ? "bg-red-500/10 ring-1 ring-red-500/30" : "bg-secondary/50 ring-1 ring-ring/40") : ""
        }`}
      >
        {leads.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-6 text-center text-xs text-muted-foreground">
              {muted ? "Dra et lead hit for å avslutte" : "Ingen leads"}
            </CardContent>
          </Card>
        ) : (
          leads.map((lead) => <PipelineCard key={lead.id} lead={lead} />)
        )}
      </div>
    </div>
  );
}

function PipelineCard({ lead }: { lead: PipelineLead }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => router.push(`/leads/${lead.id}`)}
      className="cursor-pointer touch-none"
      style={{ visibility: isDragging ? "hidden" : "visible" }}
    >
      <PipelineCardBody lead={lead} />
    </div>
  );
}

function PipelineCardBody({
  lead,
  dragging,
}: {
  lead: PipelineLead;
  dragging?: boolean;
}) {
  const rejected = lead.status === "lost";

  return (
    <Card
      className={`gap-3 py-3 transition-shadow hover:shadow-md ${
        dragging ? "shadow-lg ring-1 ring-ring/50" : ""
      } ${rejected ? "opacity-70" : ""}`}
    >
      <CardHeader className="px-3">
        <p className="text-sm font-medium">{lead.title}</p>
        {lead.locationName ? (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" />
            {lead.locationName}
            {lead.brand ? ` · ${lead.brand}` : ""}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="flex items-center justify-between px-3">
        <span className="text-sm font-medium">{formatCurrency(lead.value)}</span>
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {lead.sellerName ? (
            <Avatar className="size-6">
              <AvatarFallback className="text-[10px]">{initials(lead.sellerName)}</AvatarFallback>
            </Avatar>
          ) : null}
          {!rejected ? <MoveLeadControl leadId={lead.id} stage={lead.stage} /> : null}
        </div>
      </CardContent>
    </Card>
  );
}
