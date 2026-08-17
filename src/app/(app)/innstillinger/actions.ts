"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { locations, users, userLocations } from "@/db/schema";
import { generateInviteToken } from "@/lib/auth";
import { sendInviteEmail } from "@/lib/email";
import { requireUser } from "@/lib/current-user";

function inviteExpiry() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
}

async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "administrator") throw new Error("Krever administrator-tilgang.");
  return user;
}

export async function createLocation(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  if (!name) return { error: "Navn er påkrevd." };

  const db = getDb();
  await db.insert(locations).values({ name, address: address || null });
  revalidatePath("/innstillinger");
}

export async function deleteLocation(id: string) {
  await requireAdmin();
  const db = getDb();
  await db.delete(locations).where(eq(locations.id, id));
  revalidatePath("/innstillinger");
}

export async function createUserAccount(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "selger") as "administrator" | "salgsleder" | "selger";
  const locationIds = formData.getAll("locationIds").map(String);

  if (!name || !email) return { error: "Navn og e-post er påkrevd." };

  const db = getDb();
  const inviteToken = generateInviteToken();

  const [user] = await db
    .insert(users)
    .values({ name, email, role, inviteToken, inviteExpiresAt: inviteExpiry() })
    .returning({ id: users.id });

  if (locationIds.length > 0) {
    await db.insert(userLocations).values(locationIds.map((locationId) => ({ userId: user.id, locationId })));
  }

  try {
    await sendInviteEmail(email, name, inviteToken);
  } catch (err) {
    console.error("Failed to send invite email", err);
    return {
      error:
        "Bruker ble opprettet, men invitasjons-e-posten kunne ikke sendes. Bruk 'Send invitasjon på nytt'.",
    };
  }

  revalidatePath("/innstillinger");
}

export async function resendInvite(id: string) {
  await requireAdmin();
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user || user.passwordHash) return;

  const inviteToken = generateInviteToken();
  await db
    .update(users)
    .set({ inviteToken, inviteExpiresAt: inviteExpiry() })
    .where(eq(users.id, id));

  await sendInviteEmail(user.email, user.name, inviteToken);
  revalidatePath("/innstillinger");
}

export async function deleteUserAccount(id: string) {
  await requireAdmin();
  const db = getDb();
  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/innstillinger");
}
