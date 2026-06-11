import "server-only";

export type TelegramResult = { delivered: boolean; reason?: string };

/**
 * Send a message to a Telegram chat/channel via the Bot API. Degrades
 * gracefully: when TELEGRAM_BOT_TOKEN is unset (or no chatId), it returns
 * delivered:false instead of throwing.
 */
export async function sendTelegram(chatId: string | null | undefined, text: string): Promise<TelegramResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { delivered: false, reason: "telegram_not_configured" };
  if (!chatId) return { delivered: false, reason: "no_chat_id" };

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) return { delivered: false, reason: `telegram_error_${res.status}` };
    return { delivered: true };
  } catch {
    return { delivered: false, reason: "network_error" };
  }
}

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}
