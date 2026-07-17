import { prisma } from "@/lib/prisma";
import { entitlementsFor, tierFromPaidPlans, type Entitlements } from "@/lib/payments/entitlements";
import { activeSubscriptionPlansForUser } from "@/lib/subscriptions";

/**
 * Server-side entitlement check. Never trust client-reported payment status.
 * Access comes from a verified PAID payment row for this user (optionally
 * scoped to assessment) OR an ACTIVE, unexpired, non-FREE organization
 * subscription (admin-granted; every grant is audited).
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
  if (anyPaid) return true;

  const subscribed = await activeSubscriptionPlansForUser(userId);
  return subscribed.some((plan) => plan !== "FREE");
}

/**
 * Server-side entitlement resolution. Reads only VERIFIED PAID payments and
 * ACTIVE unexpired organization subscriptions — never client-supplied state
 * or hidden frontend flags. The highest tier from either source wins.
 */
export async function resolveEntitlements(userId: string): Promise<Entitlements> {
  const paid = await prisma.payment.findMany({
    where: { userId, status: "PAID" },
    select: { request: { select: { plan: true } } },
  });
  const paymentPlans = paid.map((p) => p.request.plan);
  const subscriptionPlans = await activeSubscriptionPlansForUser(userId);
  return entitlementsFor(tierFromPaidPlans([...paymentPlans, ...subscriptionPlans]));
}
