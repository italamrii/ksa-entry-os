import { NextRequest, NextResponse } from "next/server";
import { requireUser, assertResourceOwner, authErrorResponse } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rateLimitAsync, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { applyPaymentStatusChange } from "@/lib/payments/status";
import { demoPaymentSchema, isDemoPaymentsAllowed } from "@/lib/payments/flags";

export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };

/**
 * Local-development only payment simulation.
 * Rejected when NODE_ENV=production or ALLOW_DEMO_PAYMENTS !== true.
 */
export async function POST(request: NextRequest) {
  try {
    if (!isDemoPaymentsAllowed()) {
      return NextResponse.json(
        { error: "Demo payments disabled" },
        { status: 403, headers: noStore }
      );
    }

    const user = await requireUser();
    const ip = getClientIp(request);
    const limit = await rateLimitAsync(`demo-pay:${user.id}`, 10, 60 * 60 * 1000);
    if (!limit.success) return rateLimitResponse(limit);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400, headers: noStore });
    }

    const parsed = demoPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400, headers: noStore });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: parsed.data.paymentId },
    });
    if (!payment) {
      return NextResponse.json({ error: "Not found" }, { status: 404, headers: noStore });
    }
    assertResourceOwner(payment.userId, user.id);

    const toStatus = parsed.data.outcome === "success" ? "PAID" : "FAILED";
    const result = await applyPaymentStatusChange({
      paymentId: payment.id,
      toStatus,
      source: "demo_dev",
      actorId: user.id,
      metadata: { outcome: parsed.data.outcome },
      ipAddress: ip,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status, headers: noStore }
      );
    }

    return NextResponse.json({ success: true, status: toStatus }, { headers: noStore });
  } catch (err) {
    return authErrorResponse(err);
  }
}
