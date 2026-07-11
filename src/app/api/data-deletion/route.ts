import { NextResponse } from "next/server";
import { requireUser, authErrorResponse } from "@/lib/auth";
import { rateLimitAsync, getClientIp, rateLimitResponse } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const ip = getClientIp(request);
    const limit = await rateLimitAsync(`data-deletion:${user.id}`, 3, 24 * 60 * 60 * 1000);
    if (!limit.success) return rateLimitResponse(limit);

    await createAuditLog({
      userId: user.id,
      action: "data_deletion.requested",
      // Do not log email/PII beyond userId linkage
      ipAddress: ip,
    });

    return NextResponse.json(
      {
        success: true,
        message:
          "Your deletion request has been recorded. Our team will process it within 30 days.",
      },
      { headers: noStore }
    );
  } catch (err) {
    return authErrorResponse(err);
  }
}
