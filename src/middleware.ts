import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/server/auth/jwt";
import { SESSION_COOKIE } from "@/server/auth/constants";

// Routes that require authentication (the protected app shell).
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/leads",
  "/opportunities",
  "/accounts",
  "/contacts",
  "/activities",
  "/products",
  "/quotes",
  "/audit",
  "/import",
  "/duplicates",
];

const AUTH_PAGES = ["/sign-in", "/sign-up"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const claims = token ? await verifySession(token) : null;

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const isAuthPage = AUTH_PAGES.some((p) => pathname === p);

  if (isProtected && !claims) {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && claims) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/leads/:path*",
    "/opportunities/:path*",
    "/accounts/:path*",
    "/contacts/:path*",
    "/activities/:path*",
    "/products/:path*",
    "/quotes/:path*",
    "/audit/:path*",
    "/import/:path*",
    "/duplicates/:path*",
    "/sign-in",
    "/sign-up",
  ],
};
