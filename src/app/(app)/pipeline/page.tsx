import { eq, asc, and, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { leads, locations, users, contacts } from "@/db/schema";
import { PipelineBoard } from "./pipeline-board";
import { LocationPicker } from "./location-picker";
import { LeadFormSheet } from "../leads/lead-form";
import { requireUser } from "@/lib/current-user";
import { generalLeadScope } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function PipelinePage({ searchParams }: PageProps<"/pipeline">) {
  const user = await requireUser();
  const { locations: locationsParam } = await searchParams;
  const selectedLocationIds =
    typeof locationsParam === "string" && locationsParam.length > 0
      ? locationsParam.split(",")
      : [];

  const db = getDb();

  const conditions = [];
  const scope = generalLeadScope(user);
  if (scope) conditions.push(scope);
  if (selectedLocationIds.length && user.role !== "selger") {
    conditions.push(inArray(leads.locationId, selectedLocationIds));
  }

  const [rows, allLocations, allContacts] = await Promise.all([
    db
      .select({
        id: leads.id,
        title: leads.title,
        stage: leads.stage,
        status: leads.status,
        value: leads.value,
        brand: leads.brand,
        sellerName: users.name,
        locationName: locations.name,
      })
      .from(leads)
      .leftJoin(locations, eq(leads.locationId, locations.id))
      .leftJoin(users, eq(leads.sellerId, users.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(leads.createdAt)),
    db.select({ id: locations.id, name: locations.name }).from(locations),
    db
      .select({ id: contacts.id, firstName: contacts.firstName, lastName: contacts.lastName })
      .from(contacts),
  ]);

  const activeCount = rows.filter((r) => r.status === "active").length;
  const pickerLocations =
    user.role === "administrator"
      ? allLocations
      : allLocations.filter((l) => user.locationIds.includes(l.id));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            {activeCount} aktive lead{activeCount === 1 ? "" : "s"}. Dra et kort mellom kolonner —
            inkludert til Tapte kunder.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {user.role !== "selger" && pickerLocations.length > 1 ? (
            <LocationPicker locations={pickerLocations} selectedIds={selectedLocationIds} />
          ) : null}
          <LeadFormSheet
            locations={user.role === "administrator" ? allLocations : pickerLocations}
            contacts={allContacts}
          />
        </div>
      </div>

      <PipelineBoard leads={rows} />
    </div>
  );
}
