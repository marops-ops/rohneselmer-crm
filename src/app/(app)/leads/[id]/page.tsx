import Link from "next/link";
import { notFound } from "next/navigation";
import { eq, desc, and, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import {
  leads,
  contacts,
  locations,
  users,
  userLocations,
  leadActivities,
  reminders,
} from "@/db/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { LeadFormSheet } from "../lead-form";
import { deleteLead, completeReminder } from "../actions";
import { StageActions } from "./stage-actions";
import { ReassignDialog } from "./reassign-dialog";
import { LeadNoteForm } from "./lead-note-form";
import { ContactFormSheet } from "../../kunder/contact-form";
import { StageBadge, StatusBadge } from "@/components/stage-badge";
import { SlaBadge } from "@/components/sla-badge";
import { LiveRefresh } from "@/components/live-refresh";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { kontaktSla, behandlingsfrist } from "@/lib/sla";
import { requireUser } from "@/lib/current-user";
import { canReassignLeads } from "@/lib/rbac";
import { CompleteReminderButton } from "./complete-reminder-button";
import {
  MapPin,
  User,
  ArrowLeft,
  Tag,
  Car,
  History,
  StickyNote,
  ArrowRightLeft,
  PlusCircle,
  Bell,
} from "lucide-react";

const ACTIVITY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  opprettet: PlusCircle,
  akseptert: ArrowRightLeft,
  omfordelt: ArrowRightLeft,
  notat: StickyNote,
};

export default async function LeadDetailPage({
  params,
}: PageProps<"/leads/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const db = getDb();

  const [row] = await db
    .select({ lead: leads, contact: contacts, location: locations, seller: users })
    .from(leads)
    .leftJoin(contacts, eq(leads.contactId, contacts.id))
    .leftJoin(locations, eq(leads.locationId, locations.id))
    .leftJoin(users, eq(leads.sellerId, users.id))
    .where(eq(leads.id, id));

  if (!row) notFound();
  const { lead, contact, location, seller } = row;

  const [activities, allLocations, allContacts, pendingReminders, locationSellers] =
    await Promise.all([
      db
        .select()
        .from(leadActivities)
        .where(eq(leadActivities.leadId, id))
        .orderBy(desc(leadActivities.createdAt)),
      db.select({ id: locations.id, name: locations.name }).from(locations),
      db
        .select({ id: contacts.id, firstName: contacts.firstName, lastName: contacts.lastName })
        .from(contacts),
      db
        .select()
        .from(reminders)
        .where(and(eq(reminders.leadId, id), isNull(reminders.completedAt)))
        .orderBy(reminders.dueAt),
      db
        .select({ id: users.id, name: users.name })
        .from(users)
        .innerJoin(userLocations, eq(userLocations.userId, users.id))
        .where(and(eq(userLocations.locationId, lead.locationId), eq(users.role, "selger"))),
    ]);

  const now = new Date();
  const kontakt = kontaktSla(lead.receivedAt, lead.contactOutcomeAt, now);
  const behandling = behandlingsfrist(lead.acceptedAt, lead.handlingOutcomeAt, now);

  return (
    <div className="flex flex-col gap-6">
      <LiveRefresh />
      <div>
        <Link
          href="/leads"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Leads
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {lead.status === "active" ? (
                <StageBadge stage={lead.stage} />
              ) : (
                <StatusBadge status={lead.status} />
              )}
              {lead.status === "active" && lead.stage !== "ferdig" ? (
                <>
                  <SlaBadge label="Kontakt" sla={kontakt} />
                  <SlaBadge label="Behandling" sla={behandling} />
                </>
              ) : null}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{lead.title}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StageActions
              leadId={lead.id}
              stage={lead.stage}
              status={lead.status}
              brand={lead.brand}
            />
            {canReassignLeads(user) && lead.stage !== "ferdig" && lead.status === "active" ? (
              <ReassignDialog leadId={lead.id} sellers={locationSellers} />
            ) : null}
            <LeadFormSheet lead={lead} locations={allLocations} contacts={allContacts} />
            <ConfirmDeleteButton action={deleteLead.bind(null, lead.id)} itemLabel={lead.title} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detaljer</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-2.5">
                <Tag className="size-4 shrink-0 text-muted-foreground" />
                <span className="font-medium">{formatCurrency(lead.value)}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Car className="size-4 shrink-0 text-muted-foreground" />
                <span>
                  {lead.brand ? `${lead.brand} ${lead.model ?? ""}` : "Ingen kjøretøy valgt"}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <MapPin className="size-4 shrink-0 text-muted-foreground" />
                <span>{location?.name ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <User className="size-4 shrink-0 text-muted-foreground" />
                {contact ? (
                  <Link href={`/kunder/${contact.id}`} className="truncate hover:underline">
                    {contact.firstName} {contact.lastName ?? ""}
                  </Link>
                ) : (
                  <>
                    <span className="text-muted-foreground">Ingen kunde</span>
                    <ContactFormSheet
                      leadId={lead.id}
                      triggerLabel="Legg til kunde"
                      triggerSize="sm"
                    />
                  </>
                )}
              </div>
              {seller ? (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Selger</span>
                  <span>{seller.name}</span>
                </div>
              ) : null}
              <Separator />
              {lead.source ? (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Kilde</span>
                  <span>{lead.source}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Mottatt</span>
                <span>{formatDate(lead.receivedAt)}</span>
              </div>
              {lead.expectedDeliveryDate ? (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Forventet utlevering</span>
                  <span>{lead.expectedDeliveryDate}</span>
                </div>
              ) : null}
              {lead.status === "lost" && lead.lostReason ? (
                <>
                  <Separator />
                  <div>
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Tapt årsak</p>
                    <p className="text-sm">{lead.lostReason}</p>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          {pendingReminders.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="size-4" />
                  Påminnelser
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {pendingReminders.map((r) => (
                  <div key={r.id} className="flex items-start justify-between gap-2 text-sm">
                    <div>
                      <p>{r.message}</p>
                      <p className="text-xs text-muted-foreground">
                        Forfaller {formatDate(r.dueAt)}
                      </p>
                    </div>
                    <CompleteReminderButton
                      reminderId={r.id}
                      leadId={lead.id}
                      action={completeReminder}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aktivitet</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <LeadNoteForm leadId={lead.id} />
              <Separator />
              {activities.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Ingen aktivitet ennå.
                </p>
              ) : (
                <ul className="flex flex-col gap-4">
                  {activities.map((activity) => {
                    const Icon = ACTIVITY_ICON[activity.type] ?? History;
                    return (
                      <li key={activity.id} className="flex gap-3">
                        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary">
                          <Icon className="size-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <p className="text-sm whitespace-pre-wrap">{activity.body}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(activity.createdAt)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
