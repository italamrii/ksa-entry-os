import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, authErrorResponse } from "@/lib/auth";
import { onboardingSchema } from "@/lib/validation/schemas";
import { rateLimitAsync, rateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const limit = await rateLimitAsync(`onboarding:${user.id}`, 10, 60 * 60 * 1000);
    if (!limit.success) return rateLimitResponse(limit);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400, headers: noStore });
    }

    const parsed = onboardingSchema.strict().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400, headers: noStore });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { ...parsed.data, onboardingDone: true },
    });

    return NextResponse.json({ success: true }, { headers: noStore });
  } catch (err) {
    return authErrorResponse(err);
  }
}
