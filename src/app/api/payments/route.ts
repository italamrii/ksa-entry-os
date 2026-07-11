import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, authErrorResponse } from "@/lib/auth";
import { PRICING } from "@/lib/constants";
import { generateInvoiceNumber } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";
import { rateLimitAsync, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { paymentsFeatureFlags } from "@/lib/payments/flags";
import { getOrCreatePrimaryOrganizationId } from "@/lib/organizations";
import { z } from "zod";

export const runtime = "nodejs";

const checkoutSchema = z
  .object({
    plan: z.enum(["PROFESSIONAL", "BUSINESS"]),
    assessmentId: z.string().cuid().optional(),
  })
  .strict();

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const ip = getClientIp(request);
    const limit = await rateLimitAsync(`checkout:${user.id}`, 5, 60 * 60 * 1000);
    if (!limit.success) {
      return rateLimitResponse(limit);
    }

    const flags = paymentsFeatureFlags();
    if (!flags.paymentsEnabled) {
      return NextResponse.json(
        {
          error: "Payments not yet enabled",
          code: "PAYMENTS_DISABLED",
        },
        { status: 503, headers: noStore }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400, headers: noStore });
    }

    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400, headers: noStore });
    }

    const { plan, assessmentId } = parsed.data;
    // Canonical pricing from server — never trust client amount/currency
    const pricing = PRICING[plan];
    const organizationId = await getOrCreatePrimaryOrganizationId(user);

    if (assessmentId) {
      const assessment = await prisma.assessment.findFirst({
        where: { id: assessmentId, userId: user.id },
        select: { id: true },
      });
      if (!assessment) {
        return NextResponse.json({ error: "Not found" }, { status: 404, headers: noStore });
      }
    }

    const reportRequest = await prisma.reportRequest.create({
      data: {
        userId: user.id,
        assessmentId: assessmentId ?? null,
        plan,
        status: "PENDING",
      },
    });

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        organizationId,
        requestId: reportRequest.id,
        amount: pricing.price,
        currency: pricing.currency,
        status: "PENDING",
        invoiceNumber: generateInvoiceNumber(),
        providerPaymentId: flags.providerConfigured
          ? null
          : `pending_${crypto.randomUUID()}`,
      },
    });

    await createAuditLog({
      userId: user.id,
      organizationId,
      action: "payment.checkout_created",
      entity: "Payment",
      entityId: payment.id,
      metadata: { plan, amount: pricing.price, currency: pricing.currency },
      ipAddress: ip,
    });

    return NextResponse.json(
      {
        paymentId: payment.id,
        invoiceNumber: payment.invoiceNumber,
        amount: payment.amount,
        currency: payment.currency,
        checkoutUrl: `/payments/${payment.id}`,
        paymentsEnabled: flags.paymentsEnabled,
        providerConfigured: flags.providerConfigured,
        allowDemoPayments: flags.allowDemoPayments,
      },
      { headers: noStore }
    );
  } catch (err) {
    return authErrorResponse(err);
  }
}

/** User-callable payment status mutation is intentionally removed. */
export async function PATCH() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { ...noStore, Allow: "POST" } }
  );
}
