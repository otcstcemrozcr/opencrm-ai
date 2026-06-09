import "server-only";
import { eq, asc } from "drizzle-orm";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";

export async function listOrgUsers(orgId: string) {
  return db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(users)
    .where(eq(users.orgId, orgId))
    .orderBy(asc(users.name));
}
