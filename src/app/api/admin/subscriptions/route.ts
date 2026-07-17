import { NextResponse } from "next/server";
import { requireAdmin, authErrorResponse } from "@/lib/auth";
import { adminSubscriptionSchema } from "@/lib/validation/schemas";
import { administerSubscription, SubscriptionError } from "@/lib/subscriptions";

export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };

/**
 * Platform-admin subscription administration.
 *
 * Authorization: User.role === ADMIN (database-backed via requireAdmin — the
 * platform role, never an organization membership role). The target
 * organization is resolved server-side from the target user's membership;
 * client-supplied organization ids are not accepted. Every mutation is
 * transactional, keeps the one-ACTIVE-per-organization invariant, and writes
 * an AuditLog entry with before/after values and the acting admin id.
 */
export async function POST(request: Request) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (err) {
    return authErrorResponse(err);
  }

  const body = await request.json().catch(() => null);
  const parsed = adminSubscriptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 422, headers: noStore });
  }

  try {
    const result = await administerSubscription({
      targetUserId: parsed.data.targetUserId,
      action: parsed.data.action,
      plan: parsed.data.plan,
      currentPeriodEnd:
        parsed.data.currentPeriodEnd === undefined
          ? undefined
          : parsed.data.currentPeriodEnd === null
            ? null
            : new Date(parsed.data.currentPeriodEnd),
      actorId: admin.id,
    });
    return NextResponse.json(
      {
        organizationId: result.organizationId,
        subscription: result.after
          ? {
              plan: result.after.plan,
              status: result.after.status,
              currentPeriodEnd: result.after.currentPeriodEnd?.toISOString() ?? null,
            }
          : null,
      },
      { headers: noStore }
    );
  } catch (err) {
    if (err instanceof SubscriptionError) {
      return NextResponse.json({ error: err.message }, { status: err.status, headers: noStore });
    }
    return authErrorResponse(err);
  }
}
