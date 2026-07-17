/**
 * Regression: the language switcher must stay on the CURRENT route.
 *
 * The old switcher linked to localeHref("/", target) — a hardcoded landing
 * pathname — so switching language from any page dumped the user on the
 * landing page. switchLocalePath() is the canonical helper: same pathname,
 * same query, same hash; only `lang` changes.
 */
import { describe, it, expect } from "vitest";
import { switchLocalePath } from "@/lib/i18n/locale-utils";

describe("switchLocalePath — route preservation", () => {
  it("dashboard EN → AR stays on dashboard", () => {
    expect(switchLocalePath("/dashboard", "", "", "ar")).toBe("/dashboard?lang=ar");
  });

  it("workspace with query EN → AR keeps the query", () => {
    expect(switchLocalePath("/workspace", "tab=risks", "", "ar")).toBe("/workspace?tab=risks&lang=ar");
  });

  it("assessment step with hash EN → AR keeps query and hash, lang before hash", () => {
    expect(switchLocalePath("/assessment/new", "step=3", "#review", "ar")).toBe(
      "/assessment/new?step=3&lang=ar#review"
    );
  });

  it("settings AR → EN removes lang but keeps the route", () => {
    expect(switchLocalePath("/settings", "lang=ar", "", "en")).toBe("/settings");
  });

  it("AR → EN keeps other query params and hash", () => {
    expect(switchLocalePath("/workspace", "lang=ar&tab=risks", "#sources", "en")).toBe(
      "/workspace?tab=risks#sources"
    );
  });

  it("never duplicates lang when it is already present", () => {
    const url = switchLocalePath("/dashboard", "lang=ar", "", "ar");
    expect(url).toBe("/dashboard?lang=ar");
    expect(url.match(/lang=/g)).toHaveLength(1);
  });

  it("accepts a leading '?' in search and a bare hash", () => {
    expect(switchLocalePath("/requests", "?status=open", "review", "ar")).toBe(
      "/requests?status=open&lang=ar#review"
    );
  });

  it("CRITICAL: never falls back to the landing page from a deep route", () => {
    for (const path of ["/dashboard", "/workspace", "/settings", "/assessment/abc123", "/payments/list", "/admin/users"]) {
      const ar = switchLocalePath(path, "", "", "ar");
      const en = switchLocalePath(path, "lang=ar", "", "en");
      expect(ar.startsWith(path)).toBe(true);
      expect(en.startsWith(path)).toBe(true);
    }
  });

  it("preserves auth-relevant params like ?next= across the switch", () => {
    expect(switchLocalePath("/login", "next=%2Fworkspace", "", "ar")).toBe(
      "/login?next=%2Fworkspace&lang=ar"
    );
  });
});
