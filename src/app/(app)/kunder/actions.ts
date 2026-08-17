"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { contacts, leads } from "@/db/schema";

function fieldOrNull(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

function relationIdOrNull(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 && value !== "none" ? value : null;
}

export async function createContact(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const firstName = String(formData.get("firstName") ?? "").trim();
  if (!firstName) return { error: "Fornavn er påkrevd." };

  const db = getDb();
  const [contact] = await db
    .insert(contacts)
    .values({
      firstName,
      lastName: fieldOrNull(formData, "lastName"),
      email: fieldOrNull(formData, "email"),
      phone: fieldOrNull(formData, "phone"),
      notes: fieldOrNull(formData, "notes"),
    })
    .returning({ id: contacts.id });

  revalidatePath("/kunder");

  const leadId = relationIdOrNull(formData, "leadId");
  if (leadId) {
    await db.update(leads).set({ contactId: contact.id }).where(eq(leads.id, leadId));
    revalidatePath("/leads");
    revalidatePath(`/leads/${leadId}`);
    redirect(`/leads/${leadId}`);
  }

  redirect(`/kunder/${contact.id}`);
}

export async function updateContact(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const id = String(formData.get("id") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  if (!id) return { error: "Mangler kunde-id." };
  if (!firstName) return { error: "Fornavn er påkrevd." };

  const db = getDb();
  await db
    .update(contacts)
    .set({
      firstName,
      lastName: fieldOrNull(formData, "lastName"),
      email: fieldOrNull(formData, "email"),
      phone: fieldOrNull(formData, "phone"),
      notes: fieldOrNull(formData, "notes"),
    })
    .where(eq(contacts.id, id));

  revalidatePath("/kunder");
  revalidatePath(`/kunder/${id}`);
  redirect(`/kunder/${id}`);
}

export async function deleteContact(id: string) {
  const db = getDb();
  await db.delete(contacts).where(eq(contacts.id, id));
  revalidatePath("/kunder");
  redirect("/kunder");
}
