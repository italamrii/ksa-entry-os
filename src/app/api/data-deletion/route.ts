import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await createAuditLog({
    userId: user.id,
    action: "data_deletion.requested",
    metadata: { email: user.email },
  });

  return NextResponse.json({
    success: true,
    message: "Your deletion request has been recorded. Our team will process it within 30 days.",
  });
}
