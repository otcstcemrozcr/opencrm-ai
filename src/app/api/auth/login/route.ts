import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { verifyPassword } from "@/server/auth/password";
import { createSession } from "@/server/auth/session";
import { loginSchema } from "@/server/auth/validation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const email = parsed.data.email.toLowerCase();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Constant-ish response to avoid leaking which emails exist.
  if (!user) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const valid = await verifyPassword(user.passwordHash, parsed.data.password);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (!user.isActive) {
    return NextResponse.json(
      { error: "This account has been deactivated. Contact your administrator." },
      { status: 403 }
    );
  }

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  await createSession({ id: user.id, orgId: user.orgId, role: user.role });

  return NextResponse.json({ ok: true });
}
