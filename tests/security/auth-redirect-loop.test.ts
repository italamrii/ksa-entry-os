/**
 * Regression: stale-but-cryptographically-valid session cookies must never
 * produce a /login ⇄ /dashboard redirect loop (ERR_TOO_MANY_REDIRECTS).
 *
 * After a database recreation the browser still holds a JWT the middleware can
 * verify, but no DB session row exists. The middleware therefore must never
 * redirect the auth pages on a JWT-only check — that decision belongs to the
 * server pages, which are backed by getCurrentUser()'s database lookup.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { createSessionToken, SESSION_COOKIE } from "@/lib/auth/jwt";
import { safeInternalPath } from "@/lib/i18n/locale-utils";

const SECRET = "test-secret-that-is-at-least-32-chars-long!";

function makeRequest(path: string, cookie?: string): NextRequest {
  const req = new NextRequest(new URL(path, "https://app.example.com"));
  if (cookie) req.cookies.set(SESSION_COOKIE, cookie);
  return req;
}

let validJwt: string;

beforeAll(async () => {
  process.env.AUTH_SECRET = SECRET;
  validJwt = await createSessionToken({
    userId: "u1",
    email: "u@example.com",
    role: "USER",
    sessionId: "raw-session-token",
  });
});

describe("stale-cookie redirect loop (middleware)", () => {
  it("CRITICAL: /login is never redirected on a JWT-only check", async () => {
    const res = await middleware(makeRequest("/login", validJwt));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("CRITICAL: /register is never redirected on a JWT-only check", async () => {
    const res = await middleware(makeRequest("/register?lang=ar", validJwt));
    expect(res.status).toBe(200);
  });

  it("protected path without any cookie redirects once to /login with next", async () => {
    const res = await middleware(makeRequest("/dashboard"));
    expect(res.status).toBeGreaterThanOrEqual(300);
    const loc = new URL(res.headers.get("location")!);
    expect(loc.pathname).toBe("/login");
    expect(loc.searchParams.get("next")).toBe("/dashboard");
  });

  it("protected path preserves ?lang=ar on the login redirect", async () => {
    const res = await middleware(makeRequest("/workspace?lang=ar"));
    const loc = new URL(res.headers.get("location")!);
    expect(loc.pathname).toBe("/login");
    expect(loc.searchParams.get("lang")).toBe("ar");
    expect(loc.searchParams.get("next")).toBe("/workspace");
  });

  it("stale-cookie protected path passes through to the page (DB check decides)", async () => {
    // The middleware cannot know the DB session is gone; it must let the page's
    // getCurrentUser() make the call. The page redirects to /login, which — per
    // the tests above — renders instead of bouncing back. Loop is impossible.
    const res = await middleware(makeRequest("/dashboard", validJwt));
    expect(res.status).toBe(200);
  });

  it("non-admin JWT is redirected away from /admin", async () => {
    const res = await middleware(makeRequest("/admin", validJwt));
    const loc = new URL(res.headers.get("location")!);
    expect(loc.pathname).toBe("/dashboard");
  });

  it("garbage cookie on a protected path redirects to /login", async () => {
    const res = await middleware(makeRequest("/dashboard", "not-a-jwt"));
    const loc = new URL(res.headers.get("location")!);
    expect(loc.pathname).toBe("/login");
  });
});

describe("next-parameter sanitization", () => {
  it("accepts plain internal paths", () => {
    expect(safeInternalPath("/dashboard")).toBe("/dashboard");
    expect(safeInternalPath("/assessment/abc?lang=ar")).toBe("/assessment/abc?lang=ar");
  });

  it("rejects external, protocol-relative, and API targets", () => {
    expect(safeInternalPath("https://evil.example")).toBeNull();
    expect(safeInternalPath("//evil.example")).toBeNull();
    expect(safeInternalPath("/api/auth/logout")).toBeNull();
    expect(safeInternalPath("")).toBeNull();
    expect(safeInternalPath(null)).toBeNull();
    expect(safeInternalPath(undefined)).toBeNull();
  });
});
