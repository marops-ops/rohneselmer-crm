import Link from "next/link";
import { desc, or, ilike } from "drizzle-orm";
import { getDb } from "@/db";
import { contacts } from "@/db/schema";
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
import { Contact as ContactIcon } from "lucide-react";
import { ContactFormSheet } from "./contact-form";
import { CustomerSearch } from "./customer-search";

export default async function KunderPage({ searchParams }: PageProps<"/kunder">) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const db = getDb();

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Kunder</h1>
          <p className="text-sm text-muted-foreground">Søk kundekort etter navn, telefon eller e-post.</p>
        </div>
        <ContactFormSheet />
      </div>

      <CustomerSearch defaultValue={query} />

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
