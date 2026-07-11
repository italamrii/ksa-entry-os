import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const sectors = await prisma.sector.findMany({
      where: { isActive: true },
      select: { id: true, nameEn: true, nameAr: true, slug: true },
      orderBy: { nameEn: "asc" },
    });
    return NextResponse.json(sectors);
  } catch {
    return NextResponse.json([]);
  }
}
