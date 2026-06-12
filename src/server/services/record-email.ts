import "server-only";
import { createNote } from "@/server/services/notes";
import { sendEmail } from "@/server/email/send";
import type { ActivityRelatedType } from "@/server/db/schema";

export type SendRecordEmailInput = {
  orgId: string;
  actorId: string;
  relatedType: ActivityRelatedType;
  relatedId: string;
  to: string;
  subject: string;
  body: string;
};

export type SendRecordEmailResult = { delivered: boolean; logged: true };

/**
 * Send an email tied to a record and log it on the record's timeline (as a
 * note). Delivery degrades gracefully — when email isn't configured the email
 * is still logged so the activity history stays complete.
 */
export async function sendRecordEmail(input: SendRecordEmailInput): Promise<SendRecordEmailResult> {
  const html = input.body
    .split("\n")
    .map((line) => (line.trim() ? `<p>${line}</p>` : "<br>"))
    .join("");

  const { delivered } = await sendEmail({
    to: input.to,
    subject: input.subject,
    html,
    text: input.body,
  });

  const status = delivered ? "sent" : "logged (email not delivered)";
  const note =
    `📧 Email ${status} — to ${input.to}\n` +
    `Subject: ${input.subject}\n\n` +
    input.body;

  await createNote(input.orgId, input.actorId, input.relatedType, input.relatedId, note);

  return { delivered, logged: true };
}
