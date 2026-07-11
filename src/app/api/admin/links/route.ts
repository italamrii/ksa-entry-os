import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const linkSchema = z.object({
  titleEn: z.string().min(1),
  titleAr: z.string().min(1),
  url: z.string().url(),
  descriptionEn: z.string().optional(),
  descriptionAr: z.string().optional(),
  authorityId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    await requireAdmin();
    const links = await prisma.officialLink.findMany({
      include: { authority: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(links);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const parsed = linkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const link = await prisma.officialLink.create({ data: parsed.data });
    await createAuditLog({
      userId: admin.id,
      action: "admin.link_created",
      entity: "OfficialLink",
      entityId: link.id,
    });
    return NextResponse.json(link);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { id, ...data } = body;
    const parsed = linkSchema.safeParse(data);
    if (!parsed.success || !id) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const link = await prisma.officialLink.update({ where: { id }, data: parsed.data });
    await createAuditLog({
      userId: admin.id,
      action: "admin.link_updated",
      entity: "OfficialLink",
      entityId: id,
    });
    return NextResponse.json(link);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
