import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, authErrorResponse } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { rateLimitAsync, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { z } from "zod";

export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };

const sectorSchema = z
  .object({
    slug: z.string().min(1),
    nameEn: z.string().min(1),
    nameAr: z.string().min(1),
    isActive: z.boolean().default(true),
  })
  .strict();

export async function GET() {
  try {
    await requireAdmin();
    const sectors = await prisma.sector.findMany({ orderBy: { nameEn: "asc" } });
    return NextResponse.json(sectors, { headers: noStore });
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const ip = getClientIp(request);
    const limit = await rateLimitAsync(`admin:sectors:${admin.id}`, 30, 60 * 60 * 1000);
    if (!limit.success) return rateLimitResponse(limit);

    const body = await request.json();
    const parsed = sectorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400, headers: noStore });
    }

    const sector = await prisma.sector.create({ data: parsed.data });
    await createAuditLog({
      userId: admin.id,
      action: "admin.sector_created",
      entity: "Sector",
      entityId: sector.id,
      ipAddress: ip,
    });
    return NextResponse.json(sector, { headers: noStore });
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const ip = getClientIp(request);
    const limit = await rateLimitAsync(`admin:sectors:${admin.id}`, 30, 60 * 60 * 1000);
    if (!limit.success) return rateLimitResponse(limit);

    const body = await request.json();
    const { id, ...data } = body as { id?: string };
    const parsed = sectorSchema.safeParse(data);
    if (!parsed.success || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400, headers: noStore });
    }

    const sector = await prisma.sector.update({ where: { id }, data: parsed.data });
    await createAuditLog({
      userId: admin.id,
      action: "admin.sector_updated",
      entity: "Sector",
      entityId: id,
      ipAddress: ip,
    });
    return NextResponse.json(sector, { headers: noStore });
  } catch (err) {
    return authErrorResponse(err);
  }
}
