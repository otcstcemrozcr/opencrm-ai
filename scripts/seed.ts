import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as schema from "../src/server/db/schema";

const {
  users,
  accounts,
  contacts,
  leads,
  opportunities,
  activities,
  notes,
} = schema;

function daysFromNow(n: number) {
  return new Date(Date.now() + n * 86400000);
}
function dateStr(n: number) {
  return daysFromNow(n).toISOString().slice(0, 10);
}

async function main() {
  const conn = process.env.DATABASE_URL;
  if (!conn) throw new Error("DATABASE_URL not set");
  const client = postgres(conn, { max: 1 });
  const db = drizzle(client, { schema });

  // Seed into the demo user's org.
  const [demo] = await db
    .select({ id: users.id, orgId: users.orgId })
    .from(users)
    .where(eq(users.email, "demo@opencrm.test"))
    .limit(1);
  if (!demo) {
    throw new Error("demo@opencrm.test not found — sign up that account first.");
  }
  const orgId = demo.orgId;
  const owner = demo.id;
  console.log("Seeding org", orgId);

  // --- Accounts ---
  const accountSeed = [
    { name: "Acme Manufacturing", type: "customer" as const, industry: "Manufacturing", website: "https://acme.example", phone: "+1 212 555 0101", employees: 1200, annualRevenue: "45000000", taxNumber: "US-ACME-001", taxOffice: "New York", addressLine: "12 Industrial Way", city: "Newark", region: "NJ", country: "USA", postalCode: "07102" },
    { name: "Globex Software", type: "prospect" as const, industry: "Software", website: "https://globex.example", phone: "+1 415 555 0144", employees: 320, annualRevenue: "18000000", city: "San Francisco", region: "CA", country: "USA", postalCode: "94105" },
    { name: "Initech Services", type: "customer" as const, industry: "IT Services", website: "https://initech.example", phone: "+1 512 555 0199", employees: 540, annualRevenue: "26000000", city: "Austin", region: "TX", country: "USA" },
    { name: "Umbrella Health", type: "prospect" as const, industry: "Healthcare", website: "https://umbrella.example", phone: "+44 20 7946 0011", employees: 2100, annualRevenue: "90000000", city: "London", country: "UK" },
    { name: "Wayne Industries", type: "partner" as const, industry: "Conglomerate", website: "https://wayne.example", employees: 8000, annualRevenue: "320000000", city: "Gotham", country: "USA" },
  ];
  const insertedAccounts = await db
    .insert(accounts)
    .values(accountSeed.map((a) => ({ orgId, ownerId: owner, ...a })))
    .returning({ id: accounts.id, name: accounts.name });
  const acc = Object.fromEntries(insertedAccounts.map((a) => [a.name, a.id]));

  // --- Contacts ---
  await db.insert(contacts).values([
    { orgId, ownerId: owner, accountId: acc["Acme Manufacturing"], name: "John Carter", title: "VP Operations", email: "john.carter@acme.example", phone: "+1 212 555 0102" },
    { orgId, ownerId: owner, accountId: acc["Acme Manufacturing"], name: "Lisa Wong", title: "Procurement Lead", email: "lisa.wong@acme.example" },
    { orgId, ownerId: owner, accountId: acc["Globex Software"], name: "Raj Patel", title: "CTO", email: "raj@globex.example" },
    { orgId, ownerId: owner, accountId: acc["Initech Services"], name: "Mara Lipa", title: "Head of Sales", email: "mara@initech.example" },
    { orgId, ownerId: owner, accountId: acc["Umbrella Health"], name: "Dr. Sam Reed", title: "CIO", email: "sam.reed@umbrella.example" },
  ]);

  // --- Leads ---
  await db.insert(leads).values([
    { orgId, ownerId: owner, company: "Stark Robotics", contactName: "Pepper P.", email: "hello@stark.example", source: "Apollo", industry: "Robotics", status: "new", score: 72 },
    { orgId, ownerId: owner, company: "Hooli Cloud", contactName: "Gavin B.", email: "gavin@hooli.example", source: "Event", industry: "Cloud", status: "working", score: 55, lastActivityAt: daysFromNow(-3) },
    { orgId, ownerId: owner, company: "Pied Piper", contactName: "Richard H.", email: "richard@piedpiper.example", source: "Referral", industry: "Software", status: "qualified", score: 88, lastActivityAt: daysFromNow(-1) },
    { orgId, ownerId: owner, company: "Vehement Capital", contactName: "Russ H.", source: "LinkedIn", industry: "Finance", status: "unqualified", score: 20 },
    { orgId, ownerId: owner, company: "Soylent Foods", contactName: "Anna K.", email: "anna@soylent.example", source: "CSV", industry: "Food", status: "new", score: 41 },
  ]);

  // --- Opportunities (mix of stages, values, close dates) ---
  await db.insert(opportunities).values([
    { orgId, ownerId: owner, accountId: acc["Acme Manufacturing"], name: "Acme — ERP rollout", stage: "proposal", value: "120000", probability: 60, expectedClose: dateStr(20), competitor: "SAP", lastActivityAt: daysFromNow(-2) },
    { orgId, ownerId: owner, accountId: acc["Globex Software"], name: "Globex — Platform license", stage: "negotiation", value: "85000", probability: 75, expectedClose: dateStr(10), competitor: "Salesforce", lastActivityAt: daysFromNow(-25) },
    { orgId, ownerId: owner, accountId: acc["Initech Services"], name: "Initech — Support contract", stage: "discovery", value: "40000", probability: 30, expectedClose: dateStr(-5), lastActivityAt: daysFromNow(-18) },
    { orgId, ownerId: owner, accountId: acc["Umbrella Health"], name: "Umbrella — Data platform", stage: "qualified", value: "210000", probability: 20, expectedClose: dateStr(45), lastActivityAt: daysFromNow(-1) },
    { orgId, ownerId: owner, accountId: acc["Acme Manufacturing"], name: "Acme — Expansion phase 2", stage: "won", value: "95000", probability: 100, expectedClose: dateStr(-15), closedAt: daysFromNow(-15) },
    { orgId, ownerId: owner, accountId: acc["Wayne Industries"], name: "Wayne — Pilot", stage: "lost", value: "30000", probability: 0, expectedClose: dateStr(-30), closedAt: daysFromNow(-30) },
  ]);

  const oppRows = await db
    .select({ id: opportunities.id, name: opportunities.name })
    .from(opportunities)
    .where(eq(opportunities.orgId, orgId));
  const opp = Object.fromEntries(oppRows.map((o) => [o.name, o.id]));

  // --- Activities (overdue / today / upcoming / completed) ---
  await db.insert(activities).values([
    { orgId, ownerId: owner, type: "call", subject: "Follow up on proposal", dueAt: daysFromNow(-2), relatedType: "opportunity", relatedId: opp["Acme — ERP rollout"] },
    { orgId, ownerId: owner, type: "meeting", subject: "Contract review", dueAt: daysFromNow(0), relatedType: "opportunity", relatedId: opp["Globex — Platform license"] },
    { orgId, ownerId: owner, type: "demo", subject: "Product demo", dueAt: daysFromNow(3), relatedType: "opportunity", relatedId: opp["Umbrella — Data platform"] },
    { orgId, ownerId: owner, type: "follow_up", subject: "Send pricing", dueAt: daysFromNow(-6), relatedType: "opportunity", relatedId: opp["Initech — Support contract"] },
    { orgId, ownerId: owner, type: "call", subject: "Intro call", dueAt: daysFromNow(-10), completedAt: daysFromNow(-9), relatedType: "opportunity", relatedId: opp["Acme — Expansion phase 2"] },
    { orgId, ownerId: owner, type: "meeting", subject: "Kickoff", dueAt: daysFromNow(5), relatedType: "account", relatedId: acc["Acme Manufacturing"] },
  ]);

  // --- Notes ---
  await db.insert(notes).values([
    { orgId, authorId: owner, relatedType: "opportunity", relatedId: opp["Globex — Platform license"], body: "Champion is the CTO. Budget approved for Q3. Competing with Salesforce on price." },
    { orgId, authorId: owner, relatedType: "account", relatedId: acc["Acme Manufacturing"], body: "Strategic account. Multi-year expansion plan; phase 2 already won." },
  ]);

  console.log("Seed complete:");
  console.log(`  ${insertedAccounts.length} accounts, 5 contacts, 5 leads, 6 opportunities, 6 activities, 2 notes`);
  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
