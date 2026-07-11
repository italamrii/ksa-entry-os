import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie, createUserSession } from "@/lib/auth";
import { registerUser } from "@/lib/auth/register-user";
import { normalizeEmail, registerSchema } from "@/lib/validation/schemas";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await registerUser({
    ...parsed.data,
    email: normalizeEmail(parsed.data.email),
  });

  if (!result.ok) {
    const status =
      result.code === "DUPLICATE_EMAIL" || result.code === "INVALID_SECTOR" ? 400 : 503;
    return NextResponse.json({ error: result.message }, { status });
  }

  // User is already persisted. Session failure must not undo registration.
  try {
    const token = await createUserSession(result.userId, result.email, result.role);
    await setSessionCookie(token);
  } catch (err) {
    console.error("[register] session setup failed after user create", {
      userId: result.userId,
      name: err instanceof Error ? err.name : "Error",
      message: err instanceof Error ? err.message : "unknown",
    });
  }

  try {
    await createAuditLog({
      userId: result.userId,
      action: "user.register",
      ipAddress: ip,
      entity: "User",
      entityId: result.userId,
    });
  } catch (err) {
    console.error("[register] audit log failed", {
      userId: result.userId,
      message: err instanceof Error ? err.message : "unknown",
    });
  }

  return NextResponse.json({
    success: true,
    userId: result.userId,
  });
}
