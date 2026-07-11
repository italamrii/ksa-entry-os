import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  getSessionCookie,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/auth/session";

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

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getSessionCookie();
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const session = await prisma.session.findUnique({
    where: { token: payload.sessionId },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;

  const { user } = session;
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

export async function createUserSession(userId: string, email: string, role: "USER" | "ADMIN") {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await prisma.session.create({
    data: {
      userId,
      token: crypto.randomUUID(),
      expiresAt,
    },
  });

  const payload: SessionPayload = {
    userId,
    email,
    role,
    sessionId: session.token,
  };

  return createSessionToken(payload);
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function requireAdmin(): Promise<AuthUser> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") throw new Error("Forbidden");
  return user;
}

export { setSessionCookie, clearSessionCookie, getSessionCookie } from "@/lib/auth/session";
export { createSessionToken, verifySessionToken } from "@/lib/auth/session";
