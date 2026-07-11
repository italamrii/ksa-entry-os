import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, assertResourceOwner, authErrorResponse } from "@/lib/auth";
import { paymentsFeatureFlags } from "@/lib/payments/flags";

export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };

/** Owner-scoped payment read — status comes from DB only. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const payment = await prisma.payment.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        amount: true,
        currency: true,
        status: true,
        invoiceNumber: true,
        createdAt: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Not found" }, { status: 404, headers: noStore });
    }
    assertResourceOwner(payment.userId, user.id);

    const flags = paymentsFeatureFlags();

    return NextResponse.json(
      {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        invoiceNumber: payment.invoiceNumber,
        createdAt: payment.createdAt,
        allowDemoPayments: flags.allowDemoPayments,
        providerConfigured: flags.providerConfigured,
        paymentsEnabled: flags.paymentsEnabled,
      },
      { headers: noStore }
    );
  } catch (err) {
    return authErrorResponse(err);
  }
}
