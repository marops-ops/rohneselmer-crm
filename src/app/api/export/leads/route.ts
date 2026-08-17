import { NextResponse } from "next/server";
import { eq, and, gte, lte } from "drizzle-orm";
import { getDb } from "@/db";
import { leads, contacts, locations, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/current-user";
import { generalLeadScope } from "@/lib/rbac";
import { stageLabel } from "@/lib/pipeline";

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "month";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const now = new Date();
  let start: Date;
  if (period === "custom" && from) {
    start = new Date(from);
  } else if (period === "quarter") {
    start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  } else if (period === "year") {
    start = new Date(now.getFullYear(), 0, 1);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  const end = period === "custom" && to ? new Date(to) : now;

  const db = getDb();
  const scope = generalLeadScope(user);
  const conditions = [gte(leads.createdAt, start), lte(leads.createdAt, end)];
  if (scope) conditions.push(scope);

  const rows = await db
    .select({
      title: leads.title,
      stage: leads.stage,
      status: leads.status,
      value: leads.value,
      brand: leads.brand,
      model: leads.model,
      source: leads.source,
      createdAt: leads.createdAt,
      locationName: locations.name,
      sellerName: users.name,
      contactFirstName: contacts.firstName,
      contactLastName: contacts.lastName,
      contactEmail: contacts.email,
      contactPhone: contacts.phone,
    })
    .from(leads)
    .leftJoin(locations, eq(leads.locationId, locations.id))
    .leftJoin(users, eq(leads.sellerId, users.id))
    .leftJoin(contacts, eq(leads.contactId, contacts.id))
    .where(and(...conditions));

  const header = [
    "Tittel",
    "Stadium",
    "Status",
    "Verdi",
    "Merke",
    "Modell",
    "Kilde",
    "Lokasjon",
    "Selger",
    "Kunde",
    "E-post",
    "Telefon",
    "Opprettet",
  ];

  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.title,
        stageLabel(r.stage),
        r.status,
        r.value,
        r.brand ?? "",
        r.model ?? "",
        r.source ?? "",
        r.locationName ?? "",
        r.sellerName ?? "",
        `${r.contactFirstName ?? ""} ${r.contactLastName ?? ""}`.trim(),
        r.contactEmail ?? "",
        r.contactPhone ?? "",
        r.createdAt.toISOString(),
      ]
        .map((v) => csvEscape(String(v)))
        .join(",")
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-eksport.csv"`,
    },
  });
}
