import { NextResponse } from "next/server";
import { revokeCurrentSession, getCurrentUser } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (user) {
    await createAuditLog({ userId: user.id, action: "auth.logout" });
  }
  await revokeCurrentSession();
  // Preserve the caller locale (?lang=ar) across the logout redirect.
  const lang = new URL(request.url).searchParams.get("lang") === "ar" ? "?lang=ar" : "";
  const res = NextResponse.redirect(
    new URL(`/login${lang}`, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
    { status: 303 }
  );
  res.headers.set("Cache-Control", "no-store");
  return res;
}
