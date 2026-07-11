import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, authErrorResponse } from "@/lib/auth";
import { requirementSchema } from "@/lib/validation/schemas";
import { createAuditLog } from "@/lib/audit";
import { rateLimitAsync, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    await requireAdmin();
    const requirements = await prisma.requirement.findMany({
      include: { authority: true, sector: true },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(requirements, { headers: noStore });
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const ip = getClientIp(request);
    const limit = await rateLimitAsync(`admin:requirements:${admin.id}`, 30, 60 * 60 * 1000);
    if (!limit.success) return rateLimitResponse(limit);

    const body = await request.json();
    const parsed = requirementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400, headers: noStore });
    }

    const req = await prisma.requirement.create({ data: parsed.data });
    await createAuditLog({
      userId: admin.id,
      action: "admin.requirement_created",
      entity: "Requirement",
      entityId: req.id,
      ipAddress: ip,
    });
    return NextResponse.json(req, { headers: noStore });
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const ip = getClientIp(request);
    const limit = await rateLimitAsync(`admin:requirements:${admin.id}`, 30, 60 * 60 * 1000);
    if (!limit.success) return rateLimitResponse(limit);

    const body = await request.json();
    const { id, ...data } = body as { id?: string };
    const parsed = requirementSchema.safeParse(data);
    if (!parsed.success || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400, headers: noStore });
    }

    const req = await prisma.requirement.update({ where: { id }, data: parsed.data });
    await createAuditLog({
      userId: admin.id,
      action: "admin.requirement_updated",
      entity: "Requirement",
      entityId: id,
      ipAddress: ip,
    });
    return NextResponse.json(req, { headers: noStore });
  } catch (err) {
    return authErrorResponse(err);
  }
}
