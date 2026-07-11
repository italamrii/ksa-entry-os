import { NextResponse } from "next/server";
import { clearSessionCookie, getCurrentUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function POST() {
  const user = await getCurrentUser();
  if (user) {
    await createAuditLog({ userId: user.id, action: "auth.logout" });
  }
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
}
