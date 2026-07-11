import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, authErrorResponse } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { rateLimitAsync, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { z } from "zod";

export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };

const linkSchema = z
  .object({
    titleEn: z.string().min(1),
    titleAr: z.string().min(1),
    url: z.string().url(),
    descriptionEn: z.string().optional(),
    descriptionAr: z.string().optional(),
    authorityId: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
  })
  .strict();

export async function GET() {
  try {
    await requireAdmin();
    const links = await prisma.officialLink.findMany({
      include: { authority: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(links, { headers: noStore });
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const ip = getClientIp(request);
    const limit = await rateLimitAsync(`admin:links:${admin.id}`, 30, 60 * 60 * 1000);
    if (!limit.success) return rateLimitResponse(limit);

    const body = await request.json();
    const parsed = linkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400, headers: noStore });
    }

    const link = await prisma.officialLink.create({ data: parsed.data });
    await createAuditLog({
      userId: admin.id,
      action: "admin.link_created",
      entity: "OfficialLink",
      entityId: link.id,
      ipAddress: ip,
    });
    return NextResponse.json(link, { headers: noStore });
  } catch (err) {
    return authErrorResponse(err);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const ip = getClientIp(request);
    const limit = await rateLimitAsync(`admin:links:${admin.id}`, 30, 60 * 60 * 1000);
    if (!limit.success) return rateLimitResponse(limit);

    const body = await request.json();
    const { id, ...data } = body as { id?: string };
    const parsed = linkSchema.safeParse(data);
    if (!parsed.success || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid input" }, { status: 400, headers: noStore });
    }

    const link = await prisma.officialLink.update({ where: { id }, data: parsed.data });
    await createAuditLog({
      userId: admin.id,
      action: "admin.link_updated",
      entity: "OfficialLink",
      entityId: id,
      ipAddress: ip,
    });
    return NextResponse.json(link, { headers: noStore });
  } catch (err) {
    return authErrorResponse(err);
  }
}
