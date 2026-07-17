import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionTokenEdge } from "@/lib/auth/jwt";

const securityHeaders: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  // Next.js requires 'unsafe-inline' for some runtime bootstrap; documented residual risk.
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
};

const protectedPaths = [
  "/dashboard",
  "/workspace",
  "/assessment",
  "/requests",
  "/reports",
  "/payments",
  "/settings",
  "/onboarding",
  "/admin",
];
const adminPaths = ["/admin"];

function applySecurityHeaders(response: NextResponse, isProduction: boolean) {
  for (const [key, value] of Object.entries(securityHeaders)) {
    response.headers.set(key, value);
  }
  if (isProduction) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function middleware(request: NextRequest) {
  const isProduction = process.env.NODE_ENV === "production";
  const { pathname } = request.nextUrl;
  const rawCookie = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.AUTH_SECRET;

  let session: Awaited<ReturnType<typeof verifySessionTokenEdge>> = null;
  if (rawCookie && secret && secret.length >= 32) {
    session = await verifySessionTokenEdge(rawCookie, secret);
  }

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAdmin = adminPaths.some((p) => pathname.startsWith(p));

  // Preserve the visitor's locale (?lang=ar) across every middleware redirect.
  const lang = request.nextUrl.searchParams.get("lang") === "ar" ? "ar" : null;
  const withLang = (url: URL): URL => {
    if (lang) url.searchParams.set("lang", lang);
    return url;
  };

  if ((isProtected || isAdmin) && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    const redirect = NextResponse.redirect(withLang(loginUrl));
    return applySecurityHeaders(redirect, isProduction);
  }

  if (isAdmin && session?.role !== "ADMIN") {
    const denied = NextResponse.redirect(withLang(new URL("/dashboard", request.url)));
    return applySecurityHeaders(denied, isProduction);
  }

  // /login and /register are deliberately NOT redirected here. The middleware can
  // only verify the JWT cryptographically (edge — no DB); after a database
  // recreation a stale-but-valid cookie would bounce /login → /dashboard while the
  // page's DB-backed getCurrentUser() bounces /dashboard → /login: an infinite
  // redirect loop (ERR_TOO_MANY_REDIRECTS). The auth pages perform the DB-backed
  // "already signed in" redirect themselves, so login stays reachable and the
  // stale cookie can always be replaced by a fresh sign-in.

  const response = NextResponse.next();
  return applySecurityHeaders(response, isProduction);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
