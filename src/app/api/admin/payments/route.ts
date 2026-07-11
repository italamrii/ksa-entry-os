import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authErrorResponse } from "@/lib/auth";
import { rateLimitAsync, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { applyPaymentStatusChange } from "@/lib/payments/status";
import { adminPaymentStatusSchema } from "@/lib/payments/flags";

export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };

/** Admin-only payment status mutation with audit trail. */
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const ip = getClientIp(request);
    const limit = await rateLimitAsync(`admin-payment:${admin.id}`, 30, 60 * 60 * 1000);
    if (!limit.success) return rateLimitResponse(limit);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400, headers: noStore });
    }

    const parsed = adminPaymentStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400, headers: noStore });
    }

    const result = await applyPaymentStatusChange({
      paymentId: parsed.data.paymentId,
      toStatus: parsed.data.status,
      source: "admin",
      actorId: admin.id,
      metadata: { reason: parsed.data.reason },
      ipAddress: ip,
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status, headers: noStore }
      );
    }

    return NextResponse.json({ success: true }, { headers: noStore });
  } catch (err) {
    return authErrorResponse(err);
  }
}
