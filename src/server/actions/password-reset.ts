"use server";

import { headers } from "next/headers";
import { z } from "zod";
import {
  findUserByEmail,
  createPasswordReset,
  consumePasswordReset,
} from "@/server/services/password-reset";
import { sendEmail } from "@/server/email/send";

export type RequestState = { error?: string; done?: boolean };
export type ResetState = { error?: string; done?: boolean };

function appOrigin(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}

const emailSchema = z.string().email();

export async function requestPasswordReset(_prev: RequestState, formData: FormData): Promise<RequestState> {
  const parsed = emailSchema.safeParse((formData.get("email") as string)?.toLowerCase());
  // Always report success — never reveal whether an account exists.
  if (!parsed.success) return { done: true };

  const user = await findUserByEmail(parsed.data);
  if (user && user.isActive) {
    const { token } = await createPasswordReset(user.id, user.orgId);
    const link = `${appOrigin()}/reset-password/${token}`;
    await sendEmail({
      to: parsed.data,
      subject: "Reset your OpenCRM AI password",
      html: `<p>We received a request to reset your password.</p>
<p><a href="${link}">Reset your password</a> (valid for 1 hour). If you didn't request this, you can ignore this email.</p>
<p>If the link doesn't work, copy this URL:<br>${link}</p>`,
      text: `Reset your OpenCRM AI password (valid 1 hour): ${link}`,
    });
  }

  return { done: true };
}

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export async function performPasswordReset(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const result = await consumePasswordReset(parsed.data.token, parsed.data.password);
  if (!result.ok) return { error: result.error };

  return { done: true };
}
