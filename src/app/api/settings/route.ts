import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, authErrorResponse } from "@/lib/auth";
import { settingsSchema } from "@/lib/validation/schemas";
import { createAuditLog } from "@/lib/audit";
import { rateLimitAsync, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const ip = getClientIp(request);
    const limit = await rateLimitAsync(`settings:${user.id}`, 30, 60 * 60 * 1000);
    if (!limit.success) return rateLimitResponse(limit);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400, headers: noStore });
    }

    const parsed = settingsSchema.strict().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400, headers: noStore });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: parsed.data,
    });

    await createAuditLog({ userId: user.id, action: "settings.updated", ipAddress: ip });
    return NextResponse.json({ success: true }, { headers: noStore });
  } catch (err) {
    return authErrorResponse(err);
  }
}
