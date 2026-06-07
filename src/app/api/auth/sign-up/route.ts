import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { organizations, users } from "@/server/db/schema";
import { hashPassword } from "@/server/auth/password";
import { createSession } from "@/server/auth/session";
import { signUpSchema, slugify } from "@/server/auth/validation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = signUpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { orgName, name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  // Build a unique-ish slug.
  const baseSlug = slugify(orgName) || "org";
  const slug = `${baseSlug}-${randomUUID().slice(0, 6)}`;

  const passwordHash = await hashPassword(password);

  try {
    const result = await db.transaction(async (tx) => {
      const [org] = await tx
        .insert(organizations)
        .values({ name: orgName, slug })
        .returning();

      const [user] = await tx
        .insert(users)
        .values({
          orgId: org.id,
          email: normalizedEmail,
          passwordHash,
          name,
          role: "admin", // first user owns the org
          emailVerified: false,
        })
        .returning();

      return { org, user };
    });

    await createSession({
      id: result.user.id,
      orgId: result.org.id,
      role: "admin",
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    // Unique violation on (org_id, email) is unlikely here since org is new,
    // but a global duplicate email check keeps login unambiguous.
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }
    console.error("sign-up error", err);
    return NextResponse.json({ error: "Could not create account." }, { status: 500 });
  }
}
