"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser, canWrite } from "@/server/auth/require-user";
import { sendConversationMessage, createConnectToken } from "@/server/services/telegram-hub";

export type ReplyState = { error?: string; ok?: boolean };

const replySchema = z.object({
  conversationId: z.string().uuid(),
  text: z.string().trim().min(1, "Message is required").max(4000),
});

export async function sendMessageAction(_prev: ReplyState, formData: FormData): Promise<ReplyState> {
  const user = await requireUser();
  if (!canWrite(user.role)) return { error: "You do not have permission to do this." };

  const parsed = replySchema.safeParse({
    conversationId: formData.get("conversationId"),
    text: formData.get("text"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const res = await sendConversationMessage(user.orgId, parsed.data.conversationId, user.id, parsed.data.text);
  if (!res.ok) {
    return {
      error:
        res.reason === "telegram_not_configured"
          ? "Telegram isn't configured (set TELEGRAM_BOT_TOKEN)."
          : res.reason === "not_found"
            ? "Conversation not found."
            : "Couldn't deliver the message via Telegram.",
    };
  }

  revalidatePath(`/messages/${parsed.data.conversationId}`);
  return { ok: true };
}

export type ConnectLinkState = { link?: string; token?: string; error?: string };

function botLink(token: string): { link?: string; token: string } {
  const bot = process.env.TELEGRAM_BOT_USERNAME?.replace(/^@/, "");
  return bot ? { link: `https://t.me/${bot}?start=${token}`, token } : { token };
}

export async function createConnectLinkAction(formData: FormData): Promise<ConnectLinkState> {
  const user = await requireUser();
  if (!canWrite(user.role)) return { error: "You do not have permission to do this." };

  const contactId = (formData.get("contactId") as string) || null;
  const leadId = (formData.get("leadId") as string) || null;
  const token = await createConnectToken(user.orgId, user.id, { contactId, leadId });
  return botLink(token);
}
