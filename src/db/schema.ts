import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  numeric,
  date,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["administrator", "salgsleder", "selger"]);

export const leadStageEnum = pgEnum("lead_stage", [
  "nye",
  "under_arbeid",
  "for_oppfolging",
  "kunde_vunnet",
  "bil_levert",
  "ferdig",
]);

export const leadStatusEnum = pgEnum("lead_status", ["active", "lost"]);

export const brandEnum = pgEnum("brand", ["Ford", "Renault", "Dacia", "Alpine", "Annet"]);

export const activityTypeEnum = pgEnum("activity_type", [
  "opprettet",
  "akseptert",
  "omfordelt",
  "ikke_aktuelt",
  "tilbud_gitt",
  "provekjoring_booket",
  "kunde_avventer",
  "kontrakt_skrevet",
  "kunde_avslatt_tilbud",
  "bil_levert",
  "ferdig",
  "notat",
]);

export const reminderTypeEnum = pgEnum("reminder_type", [
  "oppfolging_3dager",
  "leveringssjekk",
  "ring_kunde_etter_levering",
]);

export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  address: text("address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("selger"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const userLocations = pgTable(
  "user_locations",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.locationId] })]
);

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "restrict" }),
  sellerId: uuid("seller_id").references(() => users.id, { onDelete: "set null" }),
  brand: brandEnum("brand"),
  model: text("model"),
  stage: leadStageEnum("stage").notNull().default("nye"),
  status: leadStatusEnum("status").notNull().default("active"),
  value: numeric("value", { precision: 12, scale: 2 }).notNull().default("0"),
  source: text("source"),
  lostReason: text("lost_reason"),
  expectedDeliveryDate: date("expected_delivery_date"),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  contactOutcomeAt: timestamp("contact_outcome_at", { withTimezone: true }),
  handlingOutcomeAt: timestamp("handling_outcome_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const leadActivities = pgTable("lead_activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  type: activityTypeEnum("type").notNull().default("notat"),
  body: text("body").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reminders = pgTable("reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  leadId: uuid("lead_id")
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  type: reminderTypeEnum("type").notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  message: text("message").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  locations: many(userLocations),
  leads: many(leads),
}));

export const userLocationsRelations = relations(userLocations, ({ one }) => ({
  user: one(users, { fields: [userLocations.userId], references: [users.id] }),
  location: one(locations, { fields: [userLocations.locationId], references: [locations.id] }),
}));

export const locationsRelations = relations(locations, ({ many }) => ({
  users: many(userLocations),
  leads: many(leads),
}));

export const contactsRelations = relations(contacts, ({ many }) => ({
  leads: many(leads),
}));

export const leadsRelations = relations(leads, ({ one, many }) => ({
  contact: one(contacts, { fields: [leads.contactId], references: [contacts.id] }),
  location: one(locations, { fields: [leads.locationId], references: [locations.id] }),
  seller: one(users, { fields: [leads.sellerId], references: [users.id] }),
  activities: many(leadActivities),
  reminders: many(reminders),
}));

export const leadActivitiesRelations = relations(leadActivities, ({ one }) => ({
  lead: one(leads, { fields: [leadActivities.leadId], references: [leads.id] }),
  user: one(users, { fields: [leadActivities.userId], references: [users.id] }),
}));

export const remindersRelations = relations(reminders, ({ one }) => ({
  lead: one(leads, { fields: [reminders.leadId], references: [leads.id] }),
}));
