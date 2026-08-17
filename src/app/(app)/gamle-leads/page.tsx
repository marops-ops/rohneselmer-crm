import Link from "next/link";
import { and, eq, asc } from "drizzle-orm";
import { getDb } from "@/db";
import { leads, locations, users } from "@/db/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StageBadge } from "@/components/stage-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { isGammeltLead, GAMMELT_LEAD_DAYS } from "@/lib/sla";
import { requireUser } from "@/lib/current-user";
import { generalLeadScope } from "@/lib/rbac";
import { Archive } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GamleLeadsPage() {
  const user = await requireUser();
  const db = getDb();

  const scope = generalLeadScope(user);
  const rows = await db
    .select({
      id: leads.id,
      title: leads.title,
      stage: leads.stage,
      value: leads.value,
      updatedAt: leads.updatedAt,
      locationName: locations.name,
      sellerName: users.name,
    })
    .from(leads)
    .leftJoin(locations, eq(leads.locationId, locations.id))
    .leftJoin(users, eq(leads.sellerId, users.id))
    .where(scope ? and(eq(leads.status, "active"), scope) : eq(leads.status, "active"))
    .orderBy(asc(leads.updatedAt));

  const now = new Date();
  const gamleLeads = rows.filter((r) => isGammeltLead(r.updatedAt, now));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Gamle Leads</h1>
        <p className="text-sm text-muted-foreground">
          Aktive leads uten aktivitet de siste {GAMMELT_LEAD_DAYS} dagene.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gammelt lead</CardTitle>
          <CardDescription>{gamleLeads.length} totalt</CardDescription>
        </CardHeader>
        <CardContent>
          {gamleLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
              <Archive className="size-8" />
              <p className="text-sm">Ingen gamle leads — alt er fulgt opp.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tittel</TableHead>
                  <TableHead>Lokasjon</TableHead>
                  <TableHead>Selger</TableHead>
                  <TableHead>Stadium</TableHead>
                  <TableHead>Sist oppdatert</TableHead>
                  <TableHead className="text-right">Verdi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gamleLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>
                      <Link href={`/leads/${lead.id}`} className="font-medium hover:underline">
                        {lead.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.locationName ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.sellerName ?? "—"}
                    </TableCell>
                    <TableCell>
                      <StageBadge stage={lead.stage} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(lead.updatedAt)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(lead.value)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
