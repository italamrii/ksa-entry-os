import { prisma } from "@/lib/prisma";

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
