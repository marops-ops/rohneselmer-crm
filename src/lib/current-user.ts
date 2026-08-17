import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users, userLocations } from "@/db/schema";
import { SESSION_COOKIE, verifySessionToken } from "./auth";

export type Role = "administrator" | "salgsleder" | "selger";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  locationIds: string[];
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const userId = verifySessionToken(token);
  if (!userId) return null;

  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) return null;

  const locs = await db
    .select({ locationId: userLocations.locationId })
    .from(userLocations)
    .where(eq(userLocations.userId, userId));

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    locationIds: locs.map((l) => l.locationId),
  };
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Ikke innlogget");
  return user;
}
