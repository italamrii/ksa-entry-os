import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { setSessionCookie, createUserSession } from "@/lib/auth";
import { registerSchema } from "@/lib/validation/schemas";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "Registration failed. Please try a different email." }, { status: 400 });
    }

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        companyName: data.companyName,
        country: data.country,
        sectorId: data.sectorId || null,
        companyType: data.companyType,
        entryGoal: data.entryGoal,
      },
    });

    const token = await createUserSession(user.id, user.email, user.role);
    await setSessionCookie(token);
    await createAuditLog({ userId: user.id, action: "user.register", ipAddress: ip });

    return NextResponse.json({ success: true, userId: user.id });
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
