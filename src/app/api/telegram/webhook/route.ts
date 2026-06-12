import { NextResponse } from "next/server";
import {
  resolveConnectToken,
  findConversationByChat,
  upsertConversation,
  recordInbound,
} from "@/server/services/telegram-hub";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TgUpdate = {
  message?: {
    message_id: number;
    text?: string;
    chat: { id: number };
    from?: { username?: string; first_name?: string; last_name?: string };
  };
};

/**
 * Telegram inbound webhook. Register it once with the Bot API setWebhook,
 * passing secret_token = TELEGRAM_WEBHOOK_SECRET. Telegram then sends that
 * value in the X-Telegram-Bot-Api-Secret-Token header on every call.
 *
 * Multi-tenant routing: a brand-new chat is only accepted if it arrives via a
 * `/start <token>` deep link that maps to an org. Subsequent messages are
 * matched to the existing conversation by chat id.
 */
export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const provided = req.headers.get("x-telegram-bot-api-secret-token");
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const update = (await req.json().catch(() => null)) as TgUpdate | null;
  const message = update?.message;
  if (!message) return NextResponse.json({ ok: true }); // ignore non-message updates

  const chatId = String(message.chat.id);
  const info = {
    username: message.from?.username ?? null,
    firstName: message.from?.first_name ?? null,
    lastName: message.from?.last_name ?? null,
  };
  const text = message.text ?? "";
  const telegramMessageId = String(message.message_id);

  // /start <token> — establish (or re-link) a conversation under the token's org.
  if (text.startsWith("/start")) {
    const token = text.slice("/start".length).trim();
    if (token) {
      const resolved = await resolveConnectToken(token);
      if (resolved) {
        await upsertConversation(resolved.orgId, chatId, info, {
          contactId: resolved.contactId,
          leadId: resolved.leadId,
        });
      }
    }
    return NextResponse.json({ ok: true });
  }

  // Regular message — route to an existing conversation only.
  const conv = await findConversationByChat(chatId);
  if (conv && text) {
    await recordInbound(conv.orgId, conv.id, { text, telegramMessageId });
  }
  return NextResponse.json({ ok: true });
}
