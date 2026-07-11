import { PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { isDemoPaymentsAllowed } from "@/lib/payments/flags";

export type PaymentMutationSource =
  | "webhook"
  | "admin"
  | "demo_dev"
  | "system";

/**
 * Apply a payment status change with immutable event + optional audit.
 * Only callable from trusted server paths (webhook, admin, demo_dev).
 */
export async function applyPaymentStatusChange(opts: {
  paymentId: string;
  toStatus: PaymentStatus;
  source: PaymentMutationSource;
  actorId?: string | null;
  idempotencyKey?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const { paymentId, toStatus, source, actorId, idempotencyKey, metadata, ipAddress } =
    opts;

  if (source === "demo_dev" && !isDemoPaymentsAllowed()) {
    return { ok: false, error: "Demo payments disabled", status: 403 };
  }

  if (idempotencyKey) {
    const existing = await prisma.payment.findUnique({
      where: { idempotencyKey },
    });
    if (existing && existing.id !== paymentId) {
      return { ok: false, error: "Idempotency conflict", status: 409 };
    }
    if (existing && existing.status === toStatus) {
      return { ok: true };
    }
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { request: true },
  });

  if (!payment) {
    return { ok: false, error: "Not found", status: 404 };
  }

  if (payment.status === toStatus) {
    return { ok: true };
  }

  const fromStatus = payment.status;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: toStatus,
        ...(idempotencyKey ? { idempotencyKey } : {}),
      },
    });

    await tx.paymentEvent.create({
      data: {
        paymentId,
        fromStatus,
        toStatus,
        source,
        actorId: actorId ?? null,
        metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });

    if (toStatus === "PAID") {
      await tx.reportRequest.update({
        where: { id: payment.requestId },
        data: { status: "IN_REVIEW" },
      });

      if (payment.request.assessmentId) {
        await tx.assessment.update({
          where: { id: payment.request.assessmentId },
          data: { isPreview: false },
        });
      }
    }
  });

  await createAuditLog({
    userId: actorId ?? payment.userId,
    action: `payment.status.${source}`,
    entity: "Payment",
    entityId: paymentId,
    metadata: { fromStatus, toStatus, source, ...(metadata ?? {}) },
    ipAddress: ipAddress ?? undefined,
  });

  return { ok: true };
}

export function isPaymentsProviderConfigured(): boolean {
  return Boolean(
    process.env.PAYMENT_PROVIDER_KEY?.trim() &&
      process.env.PAYMENT_WEBHOOK_SECRET?.trim()
  );
}
