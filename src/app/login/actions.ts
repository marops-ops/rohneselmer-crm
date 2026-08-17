"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { createSessionToken, verifyPassword, SESSION_COOKIE } from "@/lib/auth";

export async function login(_prevState: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Fyll ut e-post og passord." };
  }

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user || !user.passwordHash) {
    return { error: "Feil e-post eller passord." };
  }
  if (!(await verifyPassword(password, user.passwordHash))) {
    return { error: "Feil e-post eller passord." };
  }

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

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}
