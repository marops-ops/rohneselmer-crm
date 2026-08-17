import Link from "next/link";
import { desc, or, ilike, eq, and, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { contacts, leads, locations, users } from "@/db/schema";
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
import { Contact as ContactIcon, XCircle } from "lucide-react";
import { ContactFormSheet } from "./contact-form";
import { CustomerSearch } from "./customer-search";
import { CustomerListTabs, CUSTOMER_LISTS, type CustomerListKey } from "./customer-list-tabs";
import { requireUser } from "@/lib/current-user";
import { generalLeadScope } from "@/lib/rbac";
import { formatCurrency, formatDate } from "@/lib/format";

const WON_STAGES = ["kunde_vunnet", "bil_levert", "ferdig"] as const;

function resolveList(value: unknown): CustomerListKey {
  const key = typeof value === "string" ? value : "alle";
  return (CUSTOMER_LISTS.some((l) => l.value === key) ? key : "alle") as CustomerListKey;
}

export default async function KunderPage({ searchParams }: PageProps<"/kunder">) {
  const user = await requireUser();
  const sp = await searchParams;
  const list = resolveList(sp.list);
  const query = typeof sp.q === "string" ? sp.q.trim() : "";
  const db = getDb();

  const header = (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kunder</h1>
        <p className="text-sm text-muted-foreground">
          Kundelister etter status, eller søk kundekort direkte.
        </p>
      </div>
      <ContactFormSheet />
    </div>
  );

  if (list !== "alle") {
    const scope = generalLeadScope(user);
    const outcomeFilter =
      list === "vunnet"
        ? inArray(leads.stage, WON_STAGES)
        : list === "tapt-finansiering"
          ? and(eq(leads.status, "lost"), eq(leads.lostReason, "Ikke finansiering"))
          : and(eq(leads.status, "lost"), eq(leads.lostReason, "Konkurrent"));

    const rows = await db
      .select({
        leadId: leads.id,
        title: leads.title,
        brand: leads.brand,
        model: leads.model,
        value: leads.value,
        lostReason: leads.lostReason,
        updatedAt: leads.updatedAt,
        contactId: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        locationName: locations.name,
        sellerName: users.name,
      })
      .from(leads)
      .leftJoin(contacts, eq(leads.contactId, contacts.id))
      .leftJoin(locations, eq(leads.locationId, locations.id))
      .leftJoin(users, eq(leads.sellerId, users.id))
      .where(scope ? and(scope, outcomeFilter) : outcomeFilter)
      .orderBy(desc(leads.updatedAt));

    const listLabel = CUSTOMER_LISTS.find((l) => l.value === list)?.label ?? "";

    return (
      <div className="flex flex-col gap-6">
        {header}
        <CustomerListTabs active={list} />
        <Card>
          <CardHeader>
            <CardTitle>{listLabel}</CardTitle>
            <CardDescription>{rows.length} totalt</CardDescription>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
                <XCircle className="size-8" />
                <p className="text-sm">Ingen kunder i denne listen.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Kjøretøy</TableHead>
                    <TableHead>Selger</TableHead>
                    <TableHead>Lokasjon</TableHead>
                    <TableHead className="text-right">Verdi</TableHead>
                    <TableHead className="text-right">
                      {list === "vunnet" ? "Sist oppdatert" : "Tapt"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.leadId}>
                      <TableCell>
                        {row.contactId ? (
                          <Link
                            href={`/kunder/${row.contactId}`}
                            className="font-medium hover:underline"
                          >
                            {row.firstName} {row.lastName ?? ""}
                          </Link>
                        ) : (
                          <Link
                            href={`/leads/${row.leadId}`}
                            className="font-medium hover:underline"
                          >
                            {row.title}
                          </Link>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.brand ? `${row.brand} ${row.model ?? ""}` : "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.sellerName ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.locationName ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(row.value)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(row.updatedAt)}
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

  const rows = await db
    .select()
    .from(contacts)
    .where(
      query
        ? or(
            ilike(contacts.firstName, `%${query}%`),
            ilike(contacts.lastName, `%${query}%`),
            ilike(contacts.email, `%${query}%`),
            ilike(contacts.phone, `%${query}%`)
          )
        : undefined
    )
    .orderBy(desc(contacts.createdAt));

  return (
    <div className="flex flex-col gap-6">
      {header}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CustomerListTabs active={list} />
        <CustomerSearch defaultValue={query} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kundekort</CardTitle>
          <CardDescription>{rows.length} totalt</CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
              <ContactIcon className="size-8" />
              <p className="text-sm">Ingen kunder funnet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Navn</TableHead>
                  <TableHead>E-post</TableHead>
                  <TableHead>Telefon</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link href={`/kunder/${row.id}`} className="font-medium hover:underline">
                        {row.firstName} {row.lastName ?? ""}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.email ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{row.phone ?? "—"}</TableCell>
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
