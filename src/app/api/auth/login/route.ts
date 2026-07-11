import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { setSessionCookie, createUserSession } from "@/lib/auth";
import { loginSchema, normalizeEmail } from "@/lib/validation/schemas";
import {
  rateLimitAsync,
  getClientIp,
  rateLimitResponse,
  normalizeEmailKey,
} from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

const LOCK_THRESHOLD = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;
const noStore = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const ipLimit = await rateLimitAsync(`login:ip:${ip}`, 20, 15 * 60 * 1000);
  if (!ipLimit.success) {
    return rateLimitResponse(ipLimit, "Too many login attempts. Please try again later.");
  }

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400, headers: noStore });
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400, headers: noStore });
    }

    const normalizedEmail = normalizeEmail(parsed.data.email);
    const emailLimit = await rateLimitAsync(
      `login:email:${normalizeEmailKey(normalizedEmail)}`,
      10,
      15 * 60 * 1000
    );
    if (!emailLimit.success) {
      return rateLimitResponse(emailLimit, "Too many login attempts. Please try again later.");
    }

    const { password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Uniform response — no user enumeration
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401, headers: noStore });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401, headers: noStore }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      const failedCount = user.failedLoginCount + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginCount: failedCount,
          lockedUntil:
            failedCount >= LOCK_THRESHOLD ? new Date(Date.now() + LOCK_DURATION_MS) : null,
        },
      });
      await createAuditLog({ userId: user.id, action: "auth.login_failed", ipAddress: ip });
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401, headers: noStore });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });

    const token = await createUserSession(user.id, user.email, user.role);
    await setSessionCookie(token);
    await createAuditLog({ userId: user.id, action: "auth.login", ipAddress: ip });

    return NextResponse.json(
      {
        success: true,
        role: user.role,
        onboardingDone: user.onboardingDone,
      },
      { headers: noStore }
    );
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500, headers: noStore });
  }
}
