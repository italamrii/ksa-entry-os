import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AppShell } from "@/components/layout/app-shell";
import { NoAssessmentState } from "@/components/workspace/states";
import { localeHref } from "@/lib/i18n/locale-utils";

const html = (el: React.ReactElement) => renderToStaticMarkup(el);

/**
 * Stage 7.1 regression: Arabic locale must survive every navigation surface.
 * The bug: app-shell links, post-submit router.push targets, and server
 * redirects were emitted without `?lang=ar`, silently flipping users to English.
 */
describe("Arabic navigation preservation", () => {
  it("app-shell desktop + mobile nav links carry ?lang=ar in Arabic", () => {
    const out = html(
      <AppShell locale="ar" currentPath="/workspace" companyName="شركة">
        <div />
      </AppShell>
    );
    for (const path of ["/workspace", "/dashboard", "/assessment/new", "/requests", "/settings"]) {
      expect(out, `${path} must keep lang=ar`).toContain(`href="${path}?lang=ar"`);
      expect(out, `${path} must not appear without lang`).not.toContain(`href="${path}"`);
    }
  });

  it("app-shell English nav links stay clean (no lang param)", () => {
    const out = html(
      <AppShell locale="en" currentPath="/workspace">
        <div />
      </AppShell>
    );
    expect(out).toContain('href="/dashboard"');
    expect(out).not.toContain("lang=en");
    expect(out).not.toContain("lang=ar");
  });

  it("workspace empty-state CTA preserves Arabic", () => {
    const out = html(<NoAssessmentState locale="ar" />);
    expect(out).toContain('href="/assessment/new?lang=ar"');
  });

  it("localeHref covers the post-submit redirect shapes", () => {
    // register -> onboarding -> dashboard -> assessment result
    expect(localeHref("/onboarding", "ar")).toBe("/onboarding?lang=ar");
    expect(localeHref("/dashboard", "ar")).toBe("/dashboard?lang=ar");
    expect(localeHref("/assessment/abc123", "ar")).toBe("/assessment/abc123?lang=ar");
    // logout action + login return
    expect(localeHref("/api/auth/logout", "ar")).toBe("/api/auth/logout?lang=ar");
    expect(localeHref("/login", "ar")).toBe("/login?lang=ar");
    // existing params preserved, no duplicate lang
    expect(localeHref("/payments?plan=PROFESSIONAL", "ar")).toBe("/payments?plan=PROFESSIONAL&lang=ar");
    expect(localeHref("/payments?plan=PROFESSIONAL&lang=ar", "ar")).toBe("/payments?plan=PROFESSIONAL&lang=ar");
    // English stays clean
    expect(localeHref("/dashboard?lang=ar", "en")).toBe("/dashboard");
  });
});
