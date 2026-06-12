import "server-only";
import { and, eq, desc, asc } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db } from "@/server/db/client";
import {
  telegramConversations,
  telegramMessages,
  telegramConnectTokens,
} from "@/server/db/schema";
import { sendTelegram } from "@/server/notify/telegram";

type ChatInfo = { username?: string | null; firstName?: string | null; lastName?: string | null };

export function displayName(c: { username: string | null; firstName: string | null; lastName: string | null; chatId: string }): string {
  const full = [c.firstName, c.lastName].filter(Boolean).join(" ").trim();
  return full || (c.username ? `@${c.username}` : c.chatId);
}

// --- Connect tokens (deep-link → org routing) ---

export async function createConnectToken(
  orgId: string,
  createdById: string,
  link: { contactId?: string | null; leadId?: string | null } = {}
) {
  const token = randomBytes(12).toString("base64url");
  await db.insert(telegramConnectTokens).values({
    orgId,
    token,
    contactId: link.contactId ?? null,
    leadId: link.leadId ?? null,
    createdById,
  });
  return token;
}

export async function resolveConnectToken(token: string) {
  const [row] = await db
    .select({
      orgId: telegramConnectTokens.orgId,
      contactId: telegramConnectTokens.contactId,
      leadId: telegramConnectTokens.leadId,
    })
    .from(telegramConnectTokens)
    .where(eq(telegramConnectTokens.token, token))
    .limit(1);
  return row ?? null;
}

// --- Conversations ---

export async function findConversationByChat(chatId: string) {
  const [row] = await db
    .select()
    .from(telegramConversations)
    .where(eq(telegramConversations.chatId, chatId))
    .limit(1);
  return row ?? null;
}

/** Insert or update (by org + chatId) a conversation, returning its id. */
export async function upsertConversation(
  orgId: string,
  chatId: string,
  info: ChatInfo,
  link: { contactId?: string | null; leadId?: string | null } = {}
): Promise<string> {
  const [row] = await db
    .insert(telegramConversations)
    .values({
      orgId,
      chatId,
      username: info.username ?? null,
      firstName: info.firstName ?? null,
      lastName: info.lastName ?? null,
      linkedContactId: link.contactId ?? null,
      linkedLeadId: link.leadId ?? null,
    })
    .onConflictDoUpdate({
      target: [telegramConversations.orgId, telegramConversations.chatId],
      set: {
        username: info.username ?? null,
        firstName: info.firstName ?? null,
        lastName: info.lastName ?? null,
        ...(link.contactId ? { linkedContactId: link.contactId } : {}),
        ...(link.leadId ? { linkedLeadId: link.leadId } : {}),
      },
    })
    .returning({ id: telegramConversations.id });
  return row.id;
}

export async function listConversations(orgId: string) {
  return db
    .select()
    .from(telegramConversations)
    .where(eq(telegramConversations.orgId, orgId))
    .orderBy(desc(telegramConversations.lastMessageAt), desc(telegramConversations.createdAt));
}

export async function getConversation(orgId: string, id: string) {
  const [row] = await db
    .select()
    .from(telegramConversations)
    .where(and(eq(telegramConversations.orgId, orgId), eq(telegramConversations.id, id)))
    .limit(1);
  return row ?? null;
}

export async function listMessages(orgId: string, conversationId: string) {
  return db
    .select()
    .from(telegramMessages)
    .where(
      and(eq(telegramMessages.orgId, orgId), eq(telegramMessages.conversationId, conversationId))
    )
    .orderBy(asc(telegramMessages.createdAt));
}

// --- Messages ---

async function touchConversation(conversationId: string, preview: string) {
  await db
    .update(telegramConversations)
    .set({ lastMessageAt: new Date(), lastMessagePreview: preview.slice(0, 200) })
    .where(eq(telegramConversations.id, conversationId));
}

export async function recordInbound(
  orgId: string,
  conversationId: string,
  msg: { text: string; telegramMessageId?: string | null }
) {
  await db.insert(telegramMessages).values({
    orgId,
    conversationId,
    direction: "in",
    text: msg.text,
    telegramMessageId: msg.telegramMessageId ?? null,
  });
  await touchConversation(conversationId, msg.text);
}

export type SendResult = { ok: boolean; reason?: string };

/** Send a message in a conversation via the bot and record it as outbound. */
export async function sendConversationMessage(
  orgId: string,
  conversationId: string,
  senderUserId: string,
  text: string
): Promise<SendResult> {
  const conv = await getConversation(orgId, conversationId);
  if (!conv) return { ok: false, reason: "not_found" };

  const { delivered, reason } = await sendTelegram(conv.chatId, text);
  if (!delivered) return { ok: false, reason };

  await db.insert(telegramMessages).values({
    orgId,
    conversationId,
    direction: "out",
    text,
    senderUserId,
  });
  await touchConversation(conversationId, text);
  return { ok: true };
}
