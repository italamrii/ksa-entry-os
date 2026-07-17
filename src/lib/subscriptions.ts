import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { getPrimaryOrganizationId } from "@/lib/organizations";
import type { PlanType, SubscriptionStatus } from "@prisma/client";

/**
 * Organization-scoped subscription administration (platform ADMIN only —
 * callers must have passed requireAdmin() before reaching this module).
 *
 * Invariants:
 * - At most one ACTIVE subscription per organization: every mutation runs in a
 *   transaction that first supersedes (cancels) any other ACTIVE rows.
 * - The organization is resolved SERVER-SIDE from the target user's primary
 *   membership — an arbitrary client-supplied organization id is never
 *   trusted.
 * - Every change writes an AuditLog entry carrying the acting admin, the
 *   target organization, and full before/after values.
 */

export type SubscriptionAction = "grant" | "activate" | "cancel" | "expire";

export interface AdministerSubscriptionParams {
  /** The user whose organization is being administered. */
  targetUserId: string;
  action: SubscriptionAction;
  /** Required for `grant`; ignored otherwise. */
  plan?: PlanType;
  /** Optional period end for grant/activate; pass null to clear. */
  currentPeriodEnd?: Date | null;
  /** The acting platform admin (for the audit trail). */
  actorId: string;
}

export class SubscriptionError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

interface SubscriptionSnapshot {
  id: string;
  plan: PlanType;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
}

function snapshot(s: { id: string; plan: PlanType; status: SubscriptionStatus; currentPeriodEnd: Date | null } | null): SubscriptionSnapshot | null {
  return s ? { id: s.id, plan: s.plan, status: s.status, currentPeriodEnd: s.currentPeriodEnd } : null;
}

export async function administerSubscription(params: AdministerSubscriptionParams) {
  const organizationId = await getPrimaryOrganizationId(params.targetUserId);
  if (!organizationId) throw new SubscriptionError("Target user has no organization", 404);

  const result = await prisma.$transaction(async (tx) => {
    const active = await tx.subscription.findFirst({
      where: { organizationId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
    const before = snapshot(active);

    let after: SubscriptionSnapshot | null = null;

    switch (params.action) {
      case "grant": {
        if (!params.plan) throw new SubscriptionError("plan is required for grant", 422);
        // Supersede any other ACTIVE rows first — the single-ACTIVE invariant.
        await tx.subscription.updateMany({
          where: { organizationId, status: "ACTIVE" },
          data: { status: "CANCELED" },
        });
        const created = await tx.subscription.create({
          data: {
            organizationId,
            plan: params.plan,
            status: "ACTIVE",
            currentPeriodEnd: params.currentPeriodEnd ?? null,
          },
        });
        after = snapshot(created);
        break;
      }
      case "activate": {
        const target = await tx.subscription.findFirst({
          where: { organizationId },
          orderBy: { createdAt: "desc" },
        });
        if (!target) throw new SubscriptionError("No subscription to activate", 404);
        await tx.subscription.updateMany({
          where: { organizationId, status: "ACTIVE", id: { not: target.id } },
          data: { status: "CANCELED" },
        });
        const updated = await tx.subscription.update({
          where: { id: target.id },
          data: {
            status: "ACTIVE",
            ...(params.currentPeriodEnd !== undefined ? { currentPeriodEnd: params.currentPeriodEnd } : {}),
          },
        });
        after = snapshot(updated);
        break;
      }
      case "cancel":
      case "expire": {
        if (!active) throw new SubscriptionError("No active subscription", 404);
        const updated = await tx.subscription.update({
          where: { id: active.id },
          data: { status: params.action === "cancel" ? "CANCELED" : "EXPIRED" },
        });
        after = snapshot(updated);
        break;
      }
    }

    const remainingActive = await tx.subscription.count({
      where: { organizationId, status: "ACTIVE" },
    });
    if (remainingActive > 1) {
      // Defense in depth: the invariant must hold no matter which branch ran.
      throw new SubscriptionError("Multiple active subscriptions would result", 409);
    }

    return { before, after, organizationId };
  });

  await createAuditLog({
    userId: params.actorId,
    organizationId: result.organizationId,
    action: `admin.subscription.${params.action}`,
    entity: "Subscription",
    entityId: result.after?.id ?? result.before?.id,
    metadata: {
      targetUserId: params.targetUserId,
      before: result.before
        ? { plan: result.before.plan, status: result.before.status, currentPeriodEnd: result.before.currentPeriodEnd?.toISOString() ?? null }
        : null,
      after: result.after
        ? { plan: result.after.plan, status: result.after.status, currentPeriodEnd: result.after.currentPeriodEnd?.toISOString() ?? null }
        : null,
    },
  });

  return result;
}

/** Current ACTIVE, unexpired subscription for an organization (or null). */
export async function activeSubscriptionForOrganization(organizationId: string) {
  const sub = await prisma.subscription.findFirst({
    where: { organizationId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
  if (!sub) return null;
  if (sub.currentPeriodEnd && sub.currentPeriodEnd < new Date()) return null;
  return sub;
}

/** Active, unexpired subscription plans across every org the user belongs to. */
export async function activeSubscriptionPlansForUser(userId: string): Promise<PlanType[]> {
  const memberships = await prisma.organizationMembership.findMany({
    where: { userId },
    select: { organizationId: true },
  });
  if (memberships.length === 0) return [];
  const now = new Date();
  const subs = await prisma.subscription.findMany({
    where: {
      organizationId: { in: memberships.map((m) => m.organizationId) },
      status: "ACTIVE",
      OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: now } }],
    },
    select: { plan: true },
  });
  return subs.map((s) => s.plan);
}
