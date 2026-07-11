import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { rateLimitAsync, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { applyPaymentStatusChange } from "@/lib/payments/status";
import { webhookPaymentSchema } from "@/lib/payments/flags";

export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };

function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET?.trim();
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const provided = signature.replace(/^sha256=/, "");
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(provided, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Verified payment-provider webhook.
 * Requires PAYMENT_WEBHOOK_SECRET and HMAC signature header.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const limit = await rateLimitAsync(`webhook:payment:${ip}`, 60, 60 * 1000);
  if (!limit.success) return rateLimitResponse(limit);

  if (!process.env.PAYMENT_WEBHOOK_SECRET?.trim()) {
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 503, headers: noStore }
    );
  }

  const rawBody = await request.text();
  const signature =
    request.headers.get("x-webhook-signature") ??
    request.headers.get("x-payment-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401, headers: noStore });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: noStore });
  }

  const parsed = webhookPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400, headers: noStore });
  }

  const result = await applyPaymentStatusChange({
    paymentId: parsed.data.paymentId,
    toStatus: parsed.data.status,
    source: "webhook",
    idempotencyKey: parsed.data.eventId,
    metadata: { eventId: parsed.data.eventId },
    ipAddress: ip,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status, headers: noStore }
    );
  }

  return NextResponse.json({ received: true }, { headers: noStore });
}
