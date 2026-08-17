import Link from "next/link";
import { eq, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { leads, locations } from "@/db/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SlaBadge } from "@/components/sla-badge";
import { LiveRefresh } from "@/components/live-refresh";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { kontaktSla } from "@/lib/sla";
import { requireUser } from "@/lib/current-user";
import { nyeLeadsScope } from "@/lib/rbac";
import { AcceptLeadButton } from "./accept-lead-button";
import { Inbox, MapPin, Car } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NyeLeadsPage() {
  const user = await requireUser();
  const db = getDb();

  const scope = nyeLeadsScope(user);
  const rows = await db
    .select({
      id: leads.id,
      title: leads.title,
      value: leads.value,
      brand: leads.brand,
      model: leads.model,
      receivedAt: leads.receivedAt,
      locationName: locations.name,
    })
    .from(leads)
    .leftJoin(locations, eq(leads.locationId, locations.id))
    .where(scope)
    .orderBy(desc(leads.receivedAt));

  const now = new Date();

  return (
    <div className="flex flex-col gap-6">
      <LiveRefresh />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nye Leads</h1>
        <p className="text-sm text-muted-foreground">
          Uassignerte leads klare for aksept. Kontakt-SLA løper fra mottak.
        </p>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
            <Inbox className="size-8" />
            <p className="text-sm">Ingen nye leads akkurat nå.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((lead) => {
            const sla = kontaktSla(lead.receivedAt, null, now);
            return (
              <Card key={lead.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-base">
                    <Link href={`/leads/${lead.id}`} className="hover:underline">
                      {lead.title}
                    </Link>
                  </CardTitle>
                  <div className="flex flex-col gap-1 pt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3" />
                      {lead.locationName}
                    </span>
                    {lead.brand ? (
                      <span className="flex items-center gap-1">
                        <Car className="size-3" />
                        {lead.brand} {lead.model}
                      </span>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="mt-auto flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{formatCurrency(lead.value)}</span>
                    <SlaBadge label="Kontakt" sla={sla} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Mottatt {formatDateTime(lead.receivedAt)}
                  </p>
                  <AcceptLeadButton leadId={lead.id} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
