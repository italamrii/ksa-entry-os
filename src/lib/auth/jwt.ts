import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "ksa_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days absolute

export interface SessionPayload {
  userId: string;
  email: string;
  role: "USER" | "ADMIN";
  /** Raw session token — never log; DB stores only SHA-256(sessionId) */
  sessionId: string;
}

function encodeSecret(secret: string) {
  return new TextEncoder().encode(secret);
}

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET is missing or too short");
  }
  return encodeSecret(secret);
}

function parsePayload(payload: Record<string, unknown>): SessionPayload | null {
  if (
    typeof payload.userId !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.sessionId !== "string" ||
    (payload.role !== "USER" && payload.role !== "ADMIN")
  ) {
    return null;
  }
  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    sessionId: payload.sessionId,
  };
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    sessionId: payload.sessionId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return parsePayload(payload as Record<string, unknown>);
  } catch {
    return null;
  }
}

/** Edge-safe JWT verify for middleware (no Prisma / cookies). */
export async function verifySessionTokenEdge(
  token: string,
  secret: string
): Promise<SessionPayload | null> {
  try {
    if (!secret || secret.length < 32) return null;
    const { payload } = await jwtVerify(token, encodeSecret(secret));
    return parsePayload(payload as Record<string, unknown>);
  } catch {
    return null;
  }
}
