import { NextResponse } from "next/server";
import { runNotificationDigest } from "@/server/services/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily notification digest. Triggered by Vercel Cron (see vercel.json).
 * Secured with CRON_SECRET via `Authorization: Bearer <secret>` (Vercel sets
 * this automatically) or a `?key=<secret>` query param for manual runs.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const key = new URL(req.url).searchParams.get("key");
  const provided = auth?.replace(/^Bearer\s+/i, "") ?? key ?? undefined;

  if (secret) {
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "CRON_SECRET is not configured." }, { status: 503 });
  }

  const summary = await runNotificationDigest();
  return NextResponse.json({ ok: true, ...summary });
}
