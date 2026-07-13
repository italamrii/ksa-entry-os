import { describe, it, expect } from "vitest";
import { localeHref, getLocaleFromSearch } from "@/lib/i18n/locale-utils";

/**
 * Regression: the Arabic "See how it works" flow hung because localeHref put the
 * `?lang=ar` query AFTER the `#` fragment (`/#how-it-works?lang=ar`), making the
 * fragment `how-it-works?lang=ar` — an invalid CSS id selector that throws
 * during Next.js hash-scroll and leaves client navigation pending.
 */
describe("localeHref (Arabic hash-link hang regression)", () => {
  it("keeps the lang query BEFORE the fragment for anchor links (ar)", () => {
    expect(localeHref("/#how-it-works", "ar")).toBe("/?lang=ar#how-it-works");
  });

  it("never places the query inside the fragment — the fragment stays a valid selector", () => {
    const href = localeHref("/#how-it-works", "ar");
    const url = new URL(href, "http://x");
    // The bug produced hash === "#how-it-works?lang=ar" (contains ?/= -> throws in querySelector).
    expect(url.hash).toBe("#how-it-works");
    expect(url.hash).not.toMatch(/[?=]/);
    expect(url.searchParams.get("lang")).toBe("ar");
    // Proves the decoded fragment is a valid CSS id selector.
    expect(() => {
      // matchesSelector-style validation without a DOM:
      if (!/^[A-Za-z][\w-]*$/.test(url.hash.slice(1))) throw new SyntaxError("invalid selector");
    }).not.toThrow();
  });

  it("adds lang to a plain path (ar) and merges with an existing query", () => {
    expect(localeHref("/pricing", "ar")).toBe("/pricing?lang=ar");
    expect(localeHref("/pricing?x=1", "ar")).toBe("/pricing?x=1&lang=ar");
  });

  it("strips lang for en while preserving the fragment", () => {
    expect(localeHref("/#how-it-works", "en")).toBe("/#how-it-works");
    expect(localeHref("/?lang=ar#how-it-works", "en")).toBe("/#how-it-works");
    expect(localeHref("/pricing?lang=ar", "en")).toBe("/pricing");
    expect(localeHref("/register", "en")).toBe("/register");
  });

  it("getLocaleFromSearch resolves ar/en", () => {
    expect(getLocaleFromSearch("ar")).toBe("ar");
    expect(getLocaleFromSearch(null)).toBe("en");
    expect(getLocaleFromSearch("fr")).toBe("en");
  });
});
