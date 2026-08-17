"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { locations, users, userLocations } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { requireUser } from "@/lib/current-user";

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
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "selger") as "administrator" | "salgsleder" | "selger";
  const locationIds = formData.getAll("locationIds").map(String);

  if (!name || !email || !password) return { error: "Alle felt er påkrevd." };
  if (password.length < 8) return { error: "Passord må være minst 8 tegn." };

  const db = getDb();
  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash, role })
    .returning({ id: users.id });

  if (locationIds.length > 0) {
    await db.insert(userLocations).values(locationIds.map((locationId) => ({ userId: user.id, locationId })));
  }

  revalidatePath("/innstillinger");
}

export async function deleteUserAccount(id: string) {
  await requireAdmin();
  const db = getDb();
  await db.delete(users).where(eq(users.id, id));
  revalidatePath("/innstillinger");
}
