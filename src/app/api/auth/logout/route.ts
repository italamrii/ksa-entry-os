import { NextResponse } from "next/server";
import { revokeCurrentSession, getCurrentUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST() {
  const user = await getCurrentUser();
  if (user) {
    await createAuditLog({ userId: user.id, action: "auth.logout" });
  }
  await revokeCurrentSession();
  const res = NextResponse.redirect(
    new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
  );
  res.headers.set("Cache-Control", "no-store");
  return res;
}
