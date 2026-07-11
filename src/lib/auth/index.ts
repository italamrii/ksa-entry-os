import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  getSessionCookie,
  verifySessionToken,
  clearSessionCookie,
  type SessionPayload,
} from "@/lib/auth/session";
import { generateRawSessionToken, hashSessionToken } from "@/lib/auth/token-hash";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  companyName: string | null;
  country: string | null;
  sectorId: string | null;
  companyType: string | null;
  entryGoal: string | null;
  locale: string;
  onboardingDone: boolean;
}

function toAuthUser(user: {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  companyName: string | null;
  country: string | null;
  sectorId: string | null;
  companyType: string | null;
  entryGoal: string | null;
  locale: string;
  onboardingDone: boolean;
}): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    companyName: user.companyName,
    country: user.country,
    sectorId: user.sectorId,
    companyType: user.companyType,
    entryGoal: user.entryGoal,
    locale: user.locale,
    onboardingDone: user.onboardingDone,
  };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getSessionCookie();
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const tokenHash = hashSessionToken(payload.sessionId);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  if (session.userId !== payload.userId) return null;

  return toAuthUser(session.user);
}

/**
 * Create a new session. Stores only SHA-256(tokenHash) in DB.
 * Revokes all prior sessions for this user (session regeneration on login).
 */
export async function createUserSession(
  userId: string,
  email: string,
  role: "USER" | "ADMIN"
): Promise<string> {
  const rawToken = generateRawSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId } }),
    prisma.session.create({
      data: { userId, tokenHash, expiresAt },
    }),
  ]);

  const payload: SessionPayload = {
    userId,
    email,
    role,
    sessionId: rawToken,
  };

  return createSessionToken(payload);
}

export async function revokeCurrentSession(): Promise<void> {
  const token = await getSessionCookie();
  if (token) {
    const payload = await verifySessionToken(token);
    if (payload) {
      const tokenHash = hashSessionToken(payload.sessionId);
      await prisma.session.deleteMany({ where: { tokenHash } });
    }
  }
  await clearSessionCookie();
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    const err = new Error("Unauthorized");
    (err as Error & { status: number }).status = 401;
    throw err;
  }
  return user;
}

/** @deprecated Prefer requireUser() */
export async function requireAuth(): Promise<AuthUser> {
  return requireUser();
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    const err = new Error("Forbidden");
    (err as Error & { status: number }).status = 403;
    throw err;
  }
  return user;
}

/**
 * Ensure the resource belongs to the user. Throws 404 (not 403) to avoid leaking existence.
 */
export function assertResourceOwner(
  resourceUserId: string | null | undefined,
  userId: string
): void {
  if (!resourceUserId || resourceUserId !== userId) {
    const err = new Error("Not found");
    (err as Error & { status: number }).status = 404;
    throw err;
  }
}

export function authErrorResponse(err: unknown): Response {
  const headers = { "Cache-Control": "no-store" };
  const status =
    typeof err === "object" && err && "status" in err
      ? Number((err as { status: number }).status)
      : 500;
  if (status === 401) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  }
  if (status === 403) {
    return Response.json({ error: "Forbidden" }, { status: 403, headers });
  }
  if (status === 404) {
    return Response.json({ error: "Not found" }, { status: 404, headers });
  }
  if (process.env.NODE_ENV !== "production" && err instanceof Error) {
    console.error("[auth]", err.message);
  } else if (err instanceof Error) {
    console.error("[auth] request failed", { name: err.name });
  }
  return Response.json({ error: "Request failed" }, { status: 500, headers });
}

export { setSessionCookie, clearSessionCookie, getSessionCookie } from "@/lib/auth/session";
export { createSessionToken, verifySessionToken } from "@/lib/auth/session";
