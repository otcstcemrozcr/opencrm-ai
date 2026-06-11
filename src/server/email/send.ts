import "server-only";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendResult = { delivered: boolean; reason?: string };

/**
 * Send an email via Resend. Degrades gracefully: when RESEND_API_KEY is not
 * configured (or the call fails) it returns delivered:false instead of throwing,
 * so callers can fall back to showing a link the user can share manually.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { delivered: false, reason: "email_not_configured" };

  const from = process.env.EMAIL_FROM || "OpenCRM AI <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });
    if (!res.ok) {
      return { delivered: false, reason: `resend_error_${res.status}` };
    }
    return { delivered: true };
  } catch {
    return { delivered: false, reason: "network_error" };
  }
}

/** True when email delivery is configured for this environment. */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}
