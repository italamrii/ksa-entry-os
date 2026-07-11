import { NextRequest, NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/auth";
import { rateLimitAsync, rateLimitResponse } from "@/lib/rate-limit";
import { getLatestEvaluation, buildEvaluationView } from "@/lib/rules/service";

export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };

/**
 * Retrieve the latest persisted evaluation for an assessment (org-scoped).
 * Returns { evaluation: null } when the assessment has not been evaluated yet.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const limit = await rateLimitAsync(`evaluation:get:${user.id}`, 120, 60 * 60 * 1000);
    if (!limit.success) return rateLimitResponse(limit);

    const result = await getLatestEvaluation(user, id);
    if (!result) return NextResponse.json({ evaluation: null }, { headers: noStore });

    const view = await buildEvaluationView(result);
    return NextResponse.json({ evaluation: view }, { headers: noStore });
  } catch (err) {
    return authErrorResponse(err);
  }
}
