import type { Locale } from "@/lib/i18n";
import { localeHref } from "@/lib/i18n/locale-utils";

/**
 * Auth-aware destination for the landing-page primary CTA.
 * Pure (no I/O) so unit tests cover every state without Prisma/session.
 */
export type LandingPrimaryCtaAuth =
  | { status: "anonymous" }
  | {
      status: "authenticated";
      onboardingDone: boolean;
      hasAssessment: boolean;
    };

export function resolveLandingPrimaryCtaPath(auth: LandingPrimaryCtaAuth): string {
  if (auth.status === "anonymous") return "/register";
  if (!auth.onboardingDone) return "/onboarding";
  if (!auth.hasAssessment) return "/assessment/new";
  return "/workspace";
}

export function resolveLandingPrimaryCtaHref(
  auth: LandingPrimaryCtaAuth,
  locale: Locale
): string {
  return localeHref(resolveLandingPrimaryCtaPath(auth), locale);
}

/** Secondary CTA: how-it-works for guests; workspace for signed-in users. */
export function resolveLandingSecondaryCtaHref(
  authenticated: boolean,
  locale: Locale
): string {
  return localeHref(authenticated ? "/workspace" : "/#how-it-works", locale);
}
