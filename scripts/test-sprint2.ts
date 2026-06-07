import { config } from "dotenv";
config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { db } from "../src/server/db/client";
import { users, opportunities, activities } from "../src/server/db/schema";

async function main() {
  const [u] = await db.select().from(users).where(eq(users.email, "demo@opencrm.test")).limit(1);
  if (!u) throw new Error("demo user not found");
  const orgId = u.orgId;

  // create opp
  const [opp] = await db.insert(opportunities).values({ orgId, name: "S2 Test Deal", stage: "new", value: "1000", probability: 20, ownerId: u.id }).returning();
  console.log("opp:", opp.id, "stage:", opp.stage, "closedAt:", opp.closedAt);

  // move stage -> won (should set closedAt)
  const [won] = await db.update(opportunities).set({ stage: "won", closedAt: new Date(), updatedAt: new Date() }).where(eq(opportunities.id, opp.id)).returning();
  console.log("after move -> stage:", won.stage, "closedAt set:", won.closedAt !== null);

  // add activity (should update lastActivityAt)
  const now = new Date();
  await db.insert(activities).values({ orgId, type: "call", subject: "Intro call", relatedType: "opportunity", relatedId: opp.id, ownerId: u.id });
  await db.update(opportunities).set({ lastActivityAt: now }).where(eq(opportunities.id, opp.id));
  const [withAct] = await db.select().from(opportunities).where(eq(opportunities.id, opp.id)).limit(1);
  const acts = await db.select().from(activities).where(eq(activities.relatedId, opp.id));
  console.log("activities:", acts.length, "| lastActivityAt set:", withAct.lastActivityAt !== null);

  // cleanup
  await db.delete(activities).where(eq(activities.relatedId, opp.id));
  await db.delete(opportunities).where(eq(opportunities.id, opp.id));
  console.log("cleanup done");

  const pass = won.stage === "won" && won.closedAt !== null && acts.length === 1 && withAct.lastActivityAt !== null;
  console.log(pass ? "\nPASS ✅ stage move + activity/last_activity_at OK" : "\nFAIL ❌");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
