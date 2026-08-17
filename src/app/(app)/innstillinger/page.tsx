import { redirect } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { locations, users, userLocations, leads } from "@/db/schema";
import { KNOWN_SOURCES } from "@/lib/sources";
import { formatDateTime } from "@/lib/format";
import { CheckCircle2, XCircle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { requireUser } from "@/lib/current-user";
import { canAccessSettings } from "@/lib/rbac";
import { LocationFormSheet } from "./location-form";
import { UserFormSheet } from "./user-form";
import { deleteLocation, deleteUserAccount } from "./actions";

const ROLE_LABEL: Record<string, string> = {
  administrator: "Administrator",
  salgsleder: "Salgsleder",
  selger: "Selger",
};

export default async function InnstillingerPage() {
  const user = await requireUser();
  if (!canAccessSettings(user)) redirect("/");

  const db = getDb();
  const [allLocations, allUsers, allUserLocations, sourceStats] = await Promise.all([
    db.select().from(locations).orderBy(desc(locations.createdAt)),
    db.select().from(users).orderBy(desc(users.createdAt)),
    db
      .select({
        userId: userLocations.userId,
        locationName: locations.name,
      })
      .from(userLocations)
      .innerJoin(locations, eq(userLocations.locationId, locations.id)),
    db
      .select({
        source: leads.source,
        count: sql<number>`count(*)`,
        lastReceived: sql<Date>`max(${leads.receivedAt})`,
      })
      .from(leads)
      .groupBy(leads.source),
  ]);

  const statsBySource = new Map(sourceStats.map((s) => [s.source, s]));

  const locationsByUser = new Map<string, string[]>();
  for (const row of allUserLocations) {
    const list = locationsByUser.get(row.userId) ?? [];
    list.push(row.locationName);
    locationsByUser.set(row.userId, list);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Innstillinger</h1>
        <p className="text-sm text-muted-foreground">Administrer lokasjoner og brukere.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kilder</CardTitle>
          <CardDescription>Oversikt over leadkilder koblet til CRM-et.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kilde</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Antall leads</TableHead>
                <TableHead className="text-right">Sist mottatt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {KNOWN_SOURCES.map((source) => {
                const stats = statsBySource.get(source.key);
                return (
                  <TableRow key={source.key}>
                    <TableCell>
                      <div className="font-medium">{source.label}</div>
                      <div className="text-xs text-muted-foreground">{source.description}</div>
                    </TableCell>
                    <TableCell>
                      {source.connected ? (
                        <Badge className="gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-3.5" />
                          Tilkoblet
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-muted-foreground">
                          <XCircle className="size-3.5" />
                          Ikke tilkoblet
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{stats?.count ?? 0}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {stats?.lastReceived ? formatDateTime(stats.lastReceived) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Lokasjoner</CardTitle>
            <CardDescription>{allLocations.length} totalt</CardDescription>
          </div>
          <LocationFormSheet />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Navn</TableHead>
                <TableHead>Adresse</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {allLocations.map((loc) => (
                <TableRow key={loc.id}>
                  <TableCell className="font-medium">{loc.name}</TableCell>
                  <TableCell className="text-muted-foreground">{loc.address ?? "—"}</TableCell>
                  <TableCell>
                    <ConfirmDeleteButton
                      action={deleteLocation.bind(null, loc.id)}
                      itemLabel={loc.name}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Brukere</CardTitle>
            <CardDescription>{allUsers.length} totalt</CardDescription>
          </div>
          <UserFormSheet locations={allLocations} />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Navn</TableHead>
                <TableHead>E-post</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead>Lokasjoner</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {allUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{ROLE_LABEL[u.role]}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {u.role === "administrator"
                      ? "Alle"
                      : (locationsByUser.get(u.id) ?? []).join(", ") || "—"}
                  </TableCell>
                  <TableCell>
                    {u.id !== user.id ? (
                      <ConfirmDeleteButton
                        action={deleteUserAccount.bind(null, u.id)}
                        itemLabel={u.name}
                      />
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
