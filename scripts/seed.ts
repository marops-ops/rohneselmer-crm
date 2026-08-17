import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import bcrypt from "bcryptjs";
import * as schema from "../src/db/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const LOCATIONS = [
  { name: "Alnabru (Oslo)", address: "Strømsveien 183" },
  { name: "Røa (Oslo)", address: "Sørkedalsveien 175" },
  { name: "Lillestrøm", address: "Hurdalsgaten 23" },
  { name: "Asker og Bærum", address: "Stasjonsveien 20 (Billingstad)" },
  { name: "Drammen og Lier", address: "Industrigata 1 (Lierstranda / Bilfabrikken)" },
];

async function main() {
  console.log("Seeding locations…");
  const insertedLocations = await db
    .insert(schema.locations)
    .values(LOCATIONS)
    .returning({ id: schema.locations.id, name: schema.locations.name });

  const byName = Object.fromEntries(insertedLocations.map((l) => [l.name, l.id]));
  const alnabru = byName["Alnabru (Oslo)"];
  const roa = byName["Røa (Oslo)"];
  const lillestrom = byName["Lillestrøm"];

  console.log("Seeding users…");
  const password = "RohneSelmer2026!";
  const passwordHash = await bcrypt.hash(password, 10);

  const [admin] = await db
    .insert(schema.users)
    .values({
      name: "Administrator",
      email: "admin@rohneselmer.no",
      passwordHash,
      role: "administrator",
    })
    .returning({ id: schema.users.id });

  const [salgsleder] = await db
    .insert(schema.users)
    .values({
      name: "Salgsleder Test",
      email: "salgsleder@rohneselmer.no",
      passwordHash,
      role: "salgsleder",
    })
    .returning({ id: schema.users.id });

  const [selger1] = await db
    .insert(schema.users)
    .values({
      name: "Selger Alnabru",
      email: "selger1@rohneselmer.no",
      passwordHash,
      role: "selger",
    })
    .returning({ id: schema.users.id });

  const [selger2] = await db
    .insert(schema.users)
    .values({
      name: "Selger Lillestrøm",
      email: "selger2@rohneselmer.no",
      passwordHash,
      role: "selger",
    })
    .returning({ id: schema.users.id });

  await db.insert(schema.userLocations).values([
    { userId: salgsleder.id, locationId: alnabru },
    { userId: salgsleder.id, locationId: roa },
    { userId: selger1.id, locationId: alnabru },
    { userId: selger2.id, locationId: lillestrom },
  ]);

  console.log("\nSeed complete.");
  console.log(`Password for all seeded accounts: ${password}\n`);
  console.log("admin@rohneselmer.no        (Administrator)");
  console.log("salgsleder@rohneselmer.no   (Salgsleder — Alnabru + Røa)");
  console.log("selger1@rohneselmer.no      (Selger — Alnabru)");
  console.log("selger2@rohneselmer.no      (Selger — Lillestrøm)");
}

main().then(() => process.exit(0));
