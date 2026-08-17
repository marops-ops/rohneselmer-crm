"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { leads, leadActivities, reminders, contacts } from "@/db/schema";
import type { Stage } from "@/lib/pipeline";
import { stageLabel } from "@/lib/pipeline";
import { requireUser } from "@/lib/current-user";

function fieldOrNull(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

function relationIdOrNull(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 && value !== "none" ? value : null;
}

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function revalidateLead(id?: string) {
  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/nye-leads");
  revalidatePath("/gamle-leads");
  revalidatePath("/");
  revalidatePath("/kunder");
  if (id) revalidatePath(`/leads/${id}`);
}

async function logActivity(
  leadId: string,
  type: (typeof leadActivities.$inferInsert)["type"],
  body: string,
  userId?: string
) {
  const db = getDb();
  await db.insert(leadActivities).values({ leadId, type, body, userId: userId ?? null });
}

export async function createLead(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const user = await requireUser();
  const locationId = String(formData.get("locationId") ?? "").trim();
  const brand = fieldOrNull(formData, "brand");
  const model = fieldOrNull(formData, "model");
  if (!locationId) return { error: "Lokasjon er påkrevd." };

  const db = getDb();

  let contactId = relationIdOrNull(formData, "contactId");
  const newContactName = fieldOrNull(formData, "newContactName");
  const newContactPhone = fieldOrNull(formData, "newContactPhone");
  const newContactEmail = fieldOrNull(formData, "newContactEmail");
  if (!contactId && (newContactName || newContactPhone || newContactEmail)) {
    const nameParts = (newContactName ?? "Ukjent kunde").split(/\s+/);
    const [createdContact] = await db
      .insert(contacts)
      .values({
        firstName: nameParts[0],
        lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ") : null,
        phone: newContactPhone,
        email: newContactEmail,
      })
      .returning({ id: contacts.id });
    contactId = createdContact.id;
  }

  const title =
    fieldOrNull(formData, "title") ??
    (`${brand ?? ""} ${model ?? ""}`.trim() || newContactName || "Nytt lead");

  const valueRaw = String(formData.get("value") ?? "0").trim();
  const value = valueRaw.length > 0 ? valueRaw : "0";

  const [lead] = await db
    .insert(leads)
    .values({
      title,
      contactId,
      locationId,
      brand: brand as (typeof leads.$inferInsert)["brand"],
      model,
      value,
      source: fieldOrNull(formData, "source") ?? "Manuelt registrert",
    })
    .returning({ id: leads.id });

  await logActivity(lead.id, "opprettet", `Lead opprettet av ${user.name}.`, user.id);

  revalidateLead(lead.id);
  redirect(`/leads/${lead.id}`);
}

export async function updateLead(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!id) return { error: "Mangler lead-id." };
  if (!title) return { error: "Tittel er påkrevd." };

  const valueRaw = String(formData.get("value") ?? "0").trim();
  const value = valueRaw.length > 0 ? valueRaw : "0";

  const db = getDb();
  await db
    .update(leads)
    .set({
      title,
      contactId: relationIdOrNull(formData, "contactId"),
      locationId: String(formData.get("locationId") ?? ""),
      brand: fieldOrNull(formData, "brand") as (typeof leads.$inferInsert)["brand"],
      model: fieldOrNull(formData, "model"),
      value,
      source: fieldOrNull(formData, "source"),
      updatedAt: new Date(),
    })
    .where(eq(leads.id, id));

  revalidateLead(id);
  redirect(`/leads/${id}`);
}

export async function deleteLead(id: string) {
  const db = getDb();
  await db.delete(leads).where(eq(leads.id, id));
  revalidateLead();
  redirect("/leads");
}

/** Aksepter lead — selger tar leaden fra "Nye Leads" inn i "Under arbeid". */
export async function acceptLead(id: string) {
  const user = await requireUser();
  const db = getDb();

  await db
    .update(leads)
    .set({
      sellerId: user.id,
      acceptedAt: new Date(),
      stage: "under_arbeid",
      updatedAt: new Date(),
    })
    .where(eq(leads.id, id));

  await logActivity(id, "akseptert", `Akseptert av ${user.name}.`, user.id);
  revalidateLead(id);
}

/** Omfordel lead — salgsleder/administrator flytter leaden til en annen selger. */
export async function reassignLead(id: string, newSellerId: string, newSellerName: string) {
  const user = await requireUser();
  const db = getDb();

  await db
    .update(leads)
    .set({
      sellerId: newSellerId,
      acceptedAt: new Date(),
      handlingOutcomeAt: null,
      stage: "under_arbeid",
      updatedAt: new Date(),
    })
    .where(eq(leads.id, id));

  await logActivity(
    id,
    "omfordelt",
    `Omfordelt til ${newSellerName} av ${user.name}.`,
    user.id
  );
  revalidateLead(id);
}

/** Under arbeid → Ikke aktuelt (Tapte kunder) */
export async function markIkkeAktuelt(id: string, formData: FormData) {
  const user = await requireUser();
  const reason = String(formData.get("reason") ?? "").trim();
  const db = getDb();
  const now = new Date();

  await db
    .update(leads)
    .set({
      status: "lost",
      lostReason: reason || null,
      contactOutcomeAt: now,
      handlingOutcomeAt: now,
      updatedAt: now,
    })
    .where(eq(leads.id, id));

  await logActivity(id, "ikke_aktuelt", `Ikke aktuelt: ${reason}`, user.id);
  revalidateLead(id);
}

/** Under arbeid → Tilbud gitt → For oppfølging, med 3-dagers påminnelse. */
export async function markTilbudGitt(id: string) {
  const user = await requireUser();
  const db = getDb();
  const now = new Date();

  await db
    .update(leads)
    .set({
      stage: "for_oppfolging",
      contactOutcomeAt: now,
      handlingOutcomeAt: now,
      updatedAt: now,
    })
    .where(eq(leads.id, id));

  await db.insert(reminders).values({
    leadId: id,
    type: "oppfolging_3dager",
    dueAt: daysFromNow(3),
    message: "Kunde avventer — husk å følge opp.",
  });

  await logActivity(id, "tilbud_gitt", `Tilbud gitt av ${user.name}.`, user.id);
  revalidateLead(id);
}

/** Under arbeid → Prøvekjøring booket → For oppfølging, med 3-dagers påminnelse. */
export async function markProvekjoringBooket(id: string) {
  const user = await requireUser();
  const db = getDb();
  const now = new Date();

  await db
    .update(leads)
    .set({
      stage: "for_oppfolging",
      contactOutcomeAt: now,
      handlingOutcomeAt: now,
      updatedAt: now,
    })
    .where(eq(leads.id, id));

  await db.insert(reminders).values({
    leadId: id,
    type: "oppfolging_3dager",
    dueAt: daysFromNow(3),
    message: "Kunde avventer — husk å følge opp.",
  });

  await logActivity(id, "provekjoring_booket", `Prøvekjøring booket av ${user.name}.`, user.id);
  revalidateLead(id);
}

/** For oppfølging → Kontrakt skrevet → Kunde vunnet, med forventet utleveringsdato. */
export async function markKontraktSkrevet(id: string, formData: FormData) {
  const user = await requireUser();
  const expectedDeliveryDate = String(formData.get("expectedDeliveryDate") ?? "").trim();
  if (!expectedDeliveryDate) return { error: "Forventet utleveringsdato er påkrevd." };

  const db = getDb();
  await db
    .update(leads)
    .set({
      stage: "kunde_vunnet",
      expectedDeliveryDate,
      updatedAt: new Date(),
    })
    .where(eq(leads.id, id));

  const deliveryDate = new Date(expectedDeliveryDate);
  const checkDate = new Date(deliveryDate);
  checkDate.setDate(checkDate.getDate() - 2);

  await db.insert(reminders).values({
    leadId: id,
    type: "leveringssjekk",
    dueAt: checkDate,
    message: `Sjekk leveringsstatus før utlevering ${expectedDeliveryDate}.`,
  });

  await logActivity(
    id,
    "kontrakt_skrevet",
    `Kontrakt skrevet av ${user.name}. Forventet utlevering: ${expectedDeliveryDate}.`,
    user.id
  );
  revalidateLead(id);
}

/** For oppfølging → Kunde avslått tilbud (Tapte kunder) */
export async function markKundeAvslattTilbud(id: string, formData: FormData) {
  const user = await requireUser();
  const reason = String(formData.get("reason") ?? "").trim();
  const db = getDb();

  await db
    .update(leads)
    .set({ status: "lost", lostReason: reason || null, updatedAt: new Date() })
    .where(eq(leads.id, id));

  await logActivity(id, "kunde_avslatt_tilbud", `Kunde avslått tilbud: ${reason}`, user.id);
  revalidateLead(id);
}

/** Kunde vunnet → Er bilen levert? Ja → Bil levert, med 2-dagers oppringningspåminnelse. */
export async function markBilLevertJa(id: string) {
  const user = await requireUser();
  const db = getDb();
  const now = new Date();

  await db
    .update(leads)
    .set({ stage: "bil_levert", deliveredAt: now, updatedAt: now })
    .where(eq(leads.id, id));

  await db.insert(reminders).values({
    leadId: id,
    type: "ring_kunde_etter_levering",
    dueAt: daysFromNow(2),
    message: "Husk å ringe kunden etter levering.",
  });

  await logActivity(id, "bil_levert", `Bil levert, registrert av ${user.name}.`, user.id);
  revalidateLead(id);
}

/** Kunde vunnet → Er bilen levert? Nei → ny utleveringsdato, påminnelse flyttes. */
export async function markBilLevertNei(id: string, formData: FormData) {
  const user = await requireUser();
  const newDeliveryDate = String(formData.get("expectedDeliveryDate") ?? "").trim();
  if (!newDeliveryDate) return { error: "Ny utleveringsdato er påkrevd." };

  const db = getDb();
  await db
    .update(leads)
    .set({ expectedDeliveryDate: newDeliveryDate, updatedAt: new Date() })
    .where(eq(leads.id, id));

  const deliveryDate = new Date(newDeliveryDate);
  const checkDate = new Date(deliveryDate);
  checkDate.setDate(checkDate.getDate() - 2);

  await db.insert(reminders).values({
    leadId: id,
    type: "leveringssjekk",
    dueAt: checkDate,
    message: `Sjekk leveringsstatus før ny utlevering ${newDeliveryDate}.`,
  });

  await logActivity(
    id,
    "notat",
    `Levering utsatt av ${user.name}. Ny utleveringsdato: ${newDeliveryDate}.`,
    user.id
  );
  revalidateLead(id);
}

/** Bil levert → Registrer oppfølging → Ferdig */
export async function markFerdig(id: string) {
  const user = await requireUser();
  const db = getDb();

  await db
    .update(leads)
    .set({ stage: "ferdig", updatedAt: new Date() })
    .where(eq(leads.id, id));

  await logActivity(id, "ferdig", `Oppfølging registrert av ${user.name}. Lead ferdigstilt.`, user.id);
  revalidateLead(id);
}

export async function reopenLead(id: string) {
  const user = await requireUser();
  const db = getDb();
  await db
    .update(leads)
    .set({ status: "active", updatedAt: new Date() })
    .where(eq(leads.id, id));

  await logActivity(id, "notat", `Gjenåpnet av ${user.name}.`, user.id);
  revalidateLead(id);
}

export async function completeReminder(id: string, leadId: string) {
  const db = getDb();
  await db.update(reminders).set({ completedAt: new Date() }).where(eq(reminders.id, id));
  revalidateLead(leadId);
}

export async function addLeadNote(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const user = await requireUser();
  const leadId = String(formData.get("leadId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!leadId) return { error: "Mangler lead-id." };
  if (!body) return { error: "Notat kan ikke være tomt." };

  await logActivity(leadId, "notat", body, user.id);
  revalidatePath(`/leads/${leadId}`);
}

// Stage a manual pipeline move (drag-and-drop / "Flytt til…") is logged as, so it
// still counts toward the leaderboard's point scoring the same way the guided
// per-stage actions do.
const STAGE_ACTIVITY: Partial<Record<Stage, (typeof leadActivities.$inferInsert)["type"]>> = {
  under_arbeid: "akseptert",
  for_oppfolging: "tilbud_gitt",
  kunde_vunnet: "kontrakt_skrevet",
  bil_levert: "bil_levert",
  ferdig: "ferdig",
};

// Kept for the drag-and-drop pipeline board's generic "move to stage" control.
export async function changeLeadStage(id: string, stage: Stage) {
  const user = await requireUser();
  const db = getDb();
  await db.update(leads).set({ stage, updatedAt: new Date() }).where(eq(leads.id, id));
  const type = STAGE_ACTIVITY[stage] ?? "notat";
  await logActivity(id, type, `Flyttet til ${stageLabel(stage)} av ${user.name}.`, user.id);
  revalidateLead(id);
}

/** Manual "Tapte kunder" move (drag-and-drop / "Flytt til…" dropdown) — reason required. */
export async function rejectLead(id: string, reason: string) {
  const user = await requireUser();
  const db = getDb();
  const now = new Date();
  await db
    .update(leads)
    .set({
      status: "lost",
      lostReason: reason || null,
      contactOutcomeAt: now,
      handlingOutcomeAt: now,
      updatedAt: now,
    })
    .where(eq(leads.id, id));
  await logActivity(id, "ikke_aktuelt", `Tapt (flyttet i pipeline): ${reason}`, user.id);
  revalidateLead(id);
}
