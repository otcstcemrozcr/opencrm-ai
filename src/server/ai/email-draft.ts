import "server-only";
import { getAiProvider } from "./provider";

export type EmailDraft = { subject: string; body: string; source: "ai" | "template" };

export type DraftContext = {
  recipientName: string;
  company: string | null;
  senderName: string;
  orgName: string;
  purpose?: string | null;
};

/**
 * Draft a short outreach email. The AI writes prose only — it has no numbers to
 * invent here. Falls back to a neutral template when no provider is configured.
 */
export async function draftEmail(ctx: DraftContext): Promise<EmailDraft> {
  const who = ctx.company ? `${ctx.recipientName} at ${ctx.company}` : ctx.recipientName;
  const purpose = ctx.purpose?.trim() || "introduce ourselves and explore whether there's a fit";

  const provider = getAiProvider();
  if (provider) {
    try {
      const system =
        "You are a sales rep writing a concise, professional B2B outreach email. " +
        "Keep it under 120 words, friendly and specific. Output EXACTLY: a first line " +
        "'Subject: <subject>', then a blank line, then the email body. Do not invent facts, " +
        "prices, or commitments.";
      const user =
        `Write an email from ${ctx.senderName} (${ctx.orgName}) to ${who}. ` +
        `Goal: ${purpose}. Sign off as ${ctx.senderName}.`;
      const text = await provider.generateText(system, user, 400);
      if (text) {
        const m = text.match(/^subject:\s*(.+?)\s*\n+([\s\S]*)$/i);
        if (m) return { subject: m[1].trim(), body: m[2].trim(), source: "ai" };
        return { subject: `Hello from ${ctx.orgName}`, body: text, source: "ai" };
      }
    } catch {
      // fall through to template
    }
  }

  const subject = ctx.company ? `${ctx.orgName} × ${ctx.company}` : `Hello from ${ctx.orgName}`;
  const body =
    `Hi ${ctx.recipientName},\n\n` +
    `I'm ${ctx.senderName} from ${ctx.orgName}. I wanted to reach out to ${purpose}.\n\n` +
    `Would you be open to a short call this week?\n\n` +
    `Best,\n${ctx.senderName}`;
  return { subject, body, source: "template" };
}
