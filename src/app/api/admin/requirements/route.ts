import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { requirementSchema } from "@/lib/validation/schemas";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    await requireAdmin();
    const requirements = await prisma.requirement.findMany({
      include: { authority: true, sector: true },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(requirements);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const parsed = requirementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const req = await prisma.requirement.create({ data: parsed.data });
    await createAuditLog({
      userId: admin.id,
      action: "admin.requirement_created",
      entity: "Requirement",
      entityId: req.id,
    });
    return NextResponse.json(req);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { id, ...data } = body;
    const parsed = requirementSchema.safeParse(data);
    if (!parsed.success || !id) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const req = await prisma.requirement.update({ where: { id }, data: parsed.data });
    await createAuditLog({
      userId: admin.id,
      action: "admin.requirement_updated",
      entity: "Requirement",
      entityId: id,
    });
    return NextResponse.json(req);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
