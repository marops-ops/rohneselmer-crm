"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createSessionToken, hashPassword, SESSION_COOKIE } from "@/lib/auth";

export async function setPassword(
  _prevState: { error?: string } | undefined,
  formData: FormData
) {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token) return { error: "Ugyldig eller manglende invitasjon." };
  if (password.length < 8) return { error: "Passord må være minst 8 tegn." };
  if (password !== confirmPassword) return { error: "Passordene er ikke like." };

  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.inviteToken, token), gt(users.inviteExpiresAt, new Date())));

  if (!user) {
    return { error: "Invitasjonen er ugyldig eller har utløpt. Be en administrator sende en ny." };
  }

  const passwordHash = await hashPassword(password);
  await db
    .update(users)
    .set({ passwordHash, inviteToken: null, inviteExpiresAt: null })
    .where(eq(users.id, user.id));

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/");
}
