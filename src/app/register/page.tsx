import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { localeHref, getLocaleFromSearch } from "@/lib/i18n/locale-utils";
import type { Locale } from "@/lib/i18n";
import { RegisterForm } from "./register-form";

/**
 * Server wrapper: DB-backed "already signed in" check (see login/page.tsx for
 * why this must not live in the middleware). A stale cookie renders the form.
 */
export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ lang?: string }>;
}) {
  const { lang } = await searchParams;
  const user = await getCurrentUser();
  if (user) {
    const locale = (user.locale as Locale) ?? getLocaleFromSearch(lang);
    const dest = user.role === "ADMIN" ? "/admin" : !user.onboardingDone ? "/onboarding" : "/dashboard";
    redirect(localeHref(dest, locale));
  }
  return <RegisterForm />;
}
