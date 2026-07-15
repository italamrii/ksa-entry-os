import { describe, it, expect } from "vitest";
import {
  resolveLandingPrimaryCtaHref,
  resolveLandingPrimaryCtaPath,
  resolveLandingSecondaryCtaHref,
} from "@/lib/navigation/landing-cta";

describe("landing primary CTA routing by auth state", () => {
  it("routes anonymous English visitors to /register", () => {
    expect(resolveLandingPrimaryCtaPath({ status: "anonymous" })).toBe("/register");
    expect(resolveLandingPrimaryCtaHref({ status: "anonymous" }, "en")).toBe("/register");
  });

  it("routes anonymous Arabic visitors to /register?lang=ar", () => {
    expect(resolveLandingPrimaryCtaHref({ status: "anonymous" }, "ar")).toBe("/register?lang=ar");
  });

  it("routes authenticated incomplete-onboarding users to locale-aware /onboarding", () => {
    const auth = {
      status: "authenticated" as const,
      onboardingDone: false,
      hasAssessment: false,
    };
    expect(resolveLandingPrimaryCtaPath(auth)).toBe("/onboarding");
    expect(resolveLandingPrimaryCtaHref(auth, "en")).toBe("/onboarding");
    expect(resolveLandingPrimaryCtaHref(auth, "ar")).toBe("/onboarding?lang=ar");
  });

  it("routes authenticated users with no assessment to locale-aware /assessment/new", () => {
    const auth = {
      status: "authenticated" as const,
      onboardingDone: true,
      hasAssessment: false,
    };
    expect(resolveLandingPrimaryCtaPath(auth)).toBe("/assessment/new");
    expect(resolveLandingPrimaryCtaHref(auth, "en")).toBe("/assessment/new");
    expect(resolveLandingPrimaryCtaHref(auth, "ar")).toBe("/assessment/new?lang=ar");
  });

  it("routes authenticated ready users to locale-aware /workspace", () => {
    const auth = {
      status: "authenticated" as const,
      onboardingDone: true,
      hasAssessment: true,
    };
    expect(resolveLandingPrimaryCtaPath(auth)).toBe("/workspace");
    expect(resolveLandingPrimaryCtaHref(auth, "en")).toBe("/workspace");
    expect(resolveLandingPrimaryCtaHref(auth, "ar")).toBe("/workspace?lang=ar");
  });

  it("does not duplicate lang in Arabic hrefs", () => {
    const href = resolveLandingPrimaryCtaHref({ status: "anonymous" }, "ar");
    expect(href.match(/lang=ar/g)).toHaveLength(1);
    expect(href).not.toContain("lang=ar&lang=ar");
  });

  it("keeps Arabic See how it works anchor valid (lang before fragment)", () => {
    expect(resolveLandingSecondaryCtaHref(false, "ar")).toBe("/?lang=ar#how-it-works");
    const url = new URL(resolveLandingSecondaryCtaHref(false, "ar"), "http://x");
    expect(url.hash).toBe("#how-it-works");
    expect(url.searchParams.get("lang")).toBe("ar");
  });

  it("routes authenticated secondary CTA to workspace with locale", () => {
    expect(resolveLandingSecondaryCtaHref(true, "en")).toBe("/workspace");
    expect(resolveLandingSecondaryCtaHref(true, "ar")).toBe("/workspace?lang=ar");
  });
});
