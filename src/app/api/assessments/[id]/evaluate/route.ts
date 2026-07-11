import { NextRequest, NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { logServerError } from "@/lib/log";
import { rateLimitAsync, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { evaluateAssessment, buildEvaluationView } from "@/lib/rules/service";

export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };

/**
 * Run the deterministic rules engine for an assessment. Idempotent when nothing
 * changed: the latest result is reused unless facts or the ruleset changed.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const ip = getClientIp(request);

    const limit = await rateLimitAsync(`evaluate:${user.id}`, 30, 60 * 60 * 1000);
    if (!limit.success) return rateLimitResponse(limit);

    let result;
    try {
      result = await evaluateAssessment(user, id);
    } catch (err) {
      if (typeof err === "object" && err && "status" in err) throw err; // 404/403 handled below
      logServerError("evaluate", err);
      return NextResponse.json({ error: "Evaluation failed" }, { status: 500, headers: noStore });
    }

    if (!result.reused) {
      await createAuditLog({
        userId: user.id,
        organizationId: result.result.organizationId,
        action: "assessment.evaluated",
        entity: "EvaluationResult",
        entityId: result.result.id,
        ipAddress: ip,
      });
    }

    const view = await buildEvaluationView(result.result);
    return NextResponse.json({ reused: result.reused, evaluation: view }, { headers: noStore });
  } catch (err) {
    return authErrorResponse(err);
  }
}
