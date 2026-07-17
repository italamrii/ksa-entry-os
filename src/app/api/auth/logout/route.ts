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
  // Preserve the caller locale (?lang=ar) across the logout redirect. Base the
  // redirect on the request's own origin — an env-var base (NEXT_PUBLIC_APP_URL)
  // silently sends production users to localhost when the variable is unset.
  const lang = new URL(request.url).searchParams.get("lang") === "ar" ? "?lang=ar" : "";
  const res = NextResponse.redirect(new URL(`/login${lang}`, request.url), { status: 303 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
