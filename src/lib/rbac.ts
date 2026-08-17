import { and, eq, inArray, isNull, type SQL } from "drizzle-orm";
import { leads } from "@/db/schema";
import type { CurrentUser } from "./current-user";

const NO_LOCATIONS = ["00000000-0000-0000-0000-000000000000"];

/**
 * Visibility for Pipeline, Dashboard, Gamle Leads, and customer search:
 * - administrator: everything
 * - salgsleder: everything at their assigned locations (including unassigned nye leads)
 * - selger: only leads accepted by them
 */
export function generalLeadScope(user: CurrentUser): SQL | undefined {
  if (user.role === "administrator") return undefined;
  if (user.role === "salgsleder") {
    return inArray(leads.locationId, user.locationIds.length ? user.locationIds : NO_LOCATIONS);
  }
  return eq(leads.sellerId, user.id);
}

/**
 * Visibility for the "Nye Leads" tab specifically: unassigned leads only,
 * scoped to the user's location(s) for salgsleder/selger.
 */
export function nyeLeadsScope(user: CurrentUser): SQL | undefined {
  if (user.role === "administrator") return isNull(leads.sellerId);
  return and(
    isNull(leads.sellerId),
    inArray(leads.locationId, user.locationIds.length ? user.locationIds : NO_LOCATIONS)
  );
}

export function canAccessSettings(user: CurrentUser) {
  return user.role === "administrator";
}

export function canReassignLeads(user: CurrentUser) {
  return user.role === "administrator" || user.role === "salgsleder";
}

export function canSeeLeaderboardDetail(user: CurrentUser) {
  return user.role === "administrator" || user.role === "salgsleder";
}
