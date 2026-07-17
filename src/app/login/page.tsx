import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { localeHref, getLocaleFromSearch, safeInternalPath } from "@/lib/i18n/locale-utils";
import type { Locale } from "@/lib/i18n";
import { LoginForm } from "./login-form";

/**
 * Server wrapper: the "already signed in" redirect happens HERE, backed by the
 * database — never in the middleware, which can only verify the JWT
 * cryptographically. A stale-but-valid cookie (e.g. after a database
 * recreation) yields getCurrentUser() === null, so the form renders and the
 * cookie is replaced by the next successful sign-in instead of looping
 * /login → /dashboard → /login.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string; next?: string }>;
}) {
  const { lang, next } = await searchParams;
  const user = await getCurrentUser();
  if (user) {
    const locale = (user.locale as Locale) ?? getLocaleFromSearch(lang);
    const dest =
      user.role === "ADMIN"
        ? "/admin"
        : !user.onboardingDone
          ? "/onboarding"
          : (safeInternalPath(next) ?? "/dashboard");
    redirect(localeHref(dest, locale));
  }
  return <LoginForm />;
}
