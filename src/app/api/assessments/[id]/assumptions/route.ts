import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, authErrorResponse } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { rateLimitAsync, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { decideAssumption } from "@/lib/rules/service";

export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };

const decisionSchema = z
  .object({
    assumptionKey: z.string().trim().min(1).max(200),
    decision: z.enum(["CONFIRMED", "REJECTED"]),
  })
  .strict();

/**
 * Confirm or reject a surfaced assumption. Stored separately from the immutable
 * EvaluationResult; the next evaluate() run reflects the decision.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const ip = getClientIp(request);

    const limit = await rateLimitAsync(`assumption:${user.id}`, 60, 60 * 60 * 1000);
    if (!limit.success) return rateLimitResponse(limit);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400, headers: noStore });
    }

    const parsed = decisionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400, headers: noStore });
    }

    const decision = await decideAssumption(user, id, parsed.data.assumptionKey, parsed.data.decision);

    await createAuditLog({
      userId: user.id,
      organizationId: decision.organizationId,
      action: "assessment.assumption_decided",
      entity: "AssumptionDecision",
      entityId: decision.id,
      metadata: { assumptionKey: parsed.data.assumptionKey, decision: parsed.data.decision },
      ipAddress: ip,
    });

    return NextResponse.json(
      { success: true, assumptionKey: decision.assumptionKey, decision: decision.decision },
      { headers: noStore }
    );
  } catch (err) {
    return authErrorResponse(err);
  }
}
