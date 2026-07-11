import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const sectorSchema = z.object({
  slug: z.string().min(1),
  nameEn: z.string().min(1),
  nameAr: z.string().min(1),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    await requireAdmin();
    const sectors = await prisma.sector.findMany({ orderBy: { nameEn: "asc" } });
    return NextResponse.json(sectors);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const parsed = sectorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const sector = await prisma.sector.create({ data: parsed.data });
    await createAuditLog({
      userId: admin.id,
      action: "admin.sector_created",
      entity: "Sector",
      entityId: sector.id,
    });
    return NextResponse.json(sector);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { id, ...data } = body;
    const parsed = sectorSchema.safeParse(data);
    if (!parsed.success || !id) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const sector = await prisma.sector.update({ where: { id }, data: parsed.data });
    await createAuditLog({
      userId: admin.id,
      action: "admin.sector_updated",
      entity: "Sector",
      entityId: id,
    });
    return NextResponse.json(sector);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
