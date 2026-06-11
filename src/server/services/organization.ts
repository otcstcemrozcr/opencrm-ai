import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { organizations } from "@/server/db/schema";

export type OrganizationInput = {
  name: string;
  legalName?: string | null;
  defaultCurrency: string;
  timezone: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  taxNumber?: string | null;
  telegramChatId?: string | null;
  notificationsEnabled?: boolean;
};

export async function getOrganization(orgId: string) {
  const [row] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  return row ?? null;
}

export async function updateOrganization(orgId: string, input: OrganizationInput) {
  const [row] = await db
    .update(organizations)
    .set({
      name: input.name,
      legalName: input.legalName || null,
      defaultCurrency: input.defaultCurrency,
      timezone: input.timezone,
      logoUrl: input.logoUrl || null,
      primaryColor: input.primaryColor || null,
      phone: input.phone || null,
      website: input.website || null,
      address: input.address || null,
      taxNumber: input.taxNumber || null,
      telegramChatId: input.telegramChatId || null,
      notificationsEnabled: input.notificationsEnabled ?? true,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, orgId))
    .returning({ id: organizations.id });
  return row ?? null;
}
