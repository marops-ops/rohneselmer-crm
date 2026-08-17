import Link from "next/link";
import { desc, eq, and } from "drizzle-orm";
import { getDb } from "@/db";
import { leads, locations, contacts } from "@/db/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users } from "lucide-react";
import { LeadFormSheet } from "./lead-form";
import { StageBadge, StatusBadge } from "@/components/stage-badge";
import { formatCurrency } from "@/lib/format";
import { STAGES } from "@/lib/pipeline";
import { cn } from "@/lib/utils";
import { requireUser } from "@/lib/current-user";
import { generalLeadScope } from "@/lib/rbac";

export default async function LeadsPage({ searchParams }: PageProps<"/leads">) {
  const { locationId, contactId, stage } = await searchParams;
  const stageFilter = typeof stage === "string" ? stage : undefined;
  const prefillLocationId = typeof locationId === "string" ? locationId : undefined;
  const prefillContactId = typeof contactId === "string" ? contactId : undefined;

  const user = await requireUser();
  const db = getDb();

  const conditions = [];
  const scope = generalLeadScope(user);
  if (scope) conditions.push(scope);
  if (stageFilter) conditions.push(eq(leads.stage, stageFilter as (typeof STAGES)[number]["value"]));

  const [rows, allLocations, allContacts] = await Promise.all([
    db
      .select({
        id: leads.id,
        title: leads.title,
        stage: leads.stage,
        status: leads.status,
        value: leads.value,
        locationName: locations.name,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .leftJoin(locations, eq(leads.locationId, locations.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(leads.createdAt)),
    db.select({ id: locations.id, name: locations.name }).from(locations),
    db
      .select({ id: contacts.id, firstName: contacts.firstName, lastName: contacts.lastName })
      .from(contacts),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
          <p className="text-sm text-muted-foreground">Alle leads du har tilgang til.</p>
        </div>
        <LeadFormSheet
          locations={allLocations}
          contacts={allContacts}
          defaultLocationId={prefillLocationId}
          defaultContactId={prefillContactId}
          defaultOpen={Boolean(prefillLocationId || prefillContactId)}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Link
          href="/leads"
          className={cn(
            "rounded-md border px-2.5 py-1 text-xs font-medium",
            !stageFilter
              ? "border-foreground/20 bg-secondary text-secondary-foreground"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          Alle stadier
        </Link>
        {STAGES.map((s) => (
          <Link
            key={s.value}
            href={`/leads?stage=${s.value}`}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium",
              stageFilter === s.value
                ? "border-foreground/20 bg-secondary text-secondary-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle leads</CardTitle>
          <CardDescription>{rows.length} totalt</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
              <Users className="size-8" />
              <p className="text-sm">Ingen leads ennå.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tittel</TableHead>
                  <TableHead>Lokasjon</TableHead>
                  <TableHead>Stadium</TableHead>
                  <TableHead className="text-right">Verdi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link href={`/leads/${row.id}`} className="font-medium hover:underline">
                        {row.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.locationName ?? "—"}
                    </TableCell>
                    <TableCell>
                      {row.status === "active" ? (
                        <StageBadge stage={row.stage} />
                      ) : (
                        <StatusBadge status={row.status} />
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(row.value)}
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
