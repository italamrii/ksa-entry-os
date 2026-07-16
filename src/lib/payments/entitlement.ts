import { prisma } from "@/lib/prisma";
import { entitlementsFor, tierFromPaidPlans, type Entitlements } from "@/lib/payments/entitlements";

/**
 * Server-side entitlement check. Never trust client-reported payment status.
 * Requires a verified PAID payment row for this user (optionally scoped to assessment).
 */
export async function userHasVerifiedPaidAccess(
  userId: string,
  opts?: { assessmentId?: string }
): Promise<boolean> {
  if (opts?.assessmentId) {
    const linked = await prisma.payment.findFirst({
      where: {
        userId,
        status: "PAID",
        request: { assessmentId: opts.assessmentId },
      },
      select: { id: true },
    });
    if (linked) return true;
  }

  const anyPaid = await prisma.payment.findFirst({
    where: { userId, status: "PAID" },
    select: { id: true },
  });
  return Boolean(anyPaid);
}

/**
 * Server-side entitlement resolution. Reads only VERIFIED PAID payments —
 * never client-supplied state or hidden frontend flags.
 */
export async function resolveEntitlements(userId: string): Promise<Entitlements> {
  const paid = await prisma.payment.findMany({
    where: { userId, status: "PAID" },
    select: { request: { select: { plan: true } } },
  });
  const plans = paid.map((p) => p.request.plan);
  return entitlementsFor(tierFromPaidPlans(plans));
}
