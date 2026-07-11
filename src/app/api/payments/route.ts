import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PRICING } from "@/lib/constants";
import { generateInvoiceNumber } from "@/lib/utils";
import { createAuditLog } from "@/lib/audit";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { z } from "zod";

const checkoutSchema = z.object({
  plan: z.enum(["PROFESSIONAL", "BUSINESS"]),
  assessmentId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(request);
  const limit = rateLimit(`checkout:${user.id}`, 5, 60 * 60 * 1000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { plan, assessmentId } = parsed.data;
    const pricing = PRICING[plan];

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
        requestId: reportRequest.id,
        amount: pricing.price,
        currency: pricing.currency,
        status: "PENDING",
        invoiceNumber: generateInvoiceNumber(),
        providerPaymentId: `demo_${crypto.randomUUID()}`,
      },
    });

    await createAuditLog({
      userId: user.id,
      action: "payment.checkout_created",
      entity: "Payment",
      entityId: payment.id,
      metadata: { plan, amount: pricing.price },
      ipAddress: ip,
    });

    return NextResponse.json({
      paymentId: payment.id,
      invoiceNumber: payment.invoiceNumber,
      amount: payment.amount,
      currency: payment.currency,
      checkoutUrl: `/payments/${payment.id}`,
    });
  } catch {
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ip = getClientIp(request);
  const limit = rateLimit(`payment-callback:${ip}`, 20, 60 * 1000);
  if (!limit.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { paymentId, status } = await request.json();
    if (!paymentId || !["PAID", "FAILED"].includes(status)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, userId: user.id },
      include: { request: true },
    });

    if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.payment.update({
      where: { id: paymentId },
      data: { status },
    });

    if (status === "PAID") {
      await prisma.reportRequest.update({
        where: { id: payment.requestId },
        data: { status: "IN_REVIEW" },
      });

      if (payment.request.assessmentId) {
        await prisma.assessment.update({
          where: { id: payment.request.assessmentId },
          data: { isPreview: false },
        });
      }
    }

    await createAuditLog({
      userId: user.id,
      action: "payment.status_changed",
      entity: "Payment",
      entityId: paymentId,
      metadata: { status },
      ipAddress: ip,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
