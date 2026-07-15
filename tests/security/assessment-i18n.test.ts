import { describe, it, expect } from "vitest";
import {
  ASSESSMENT_QUESTIONS,
  ASSESSMENT_UI,
  optionLabel,
  questionHint,
  questionTitle,
} from "@/lib/i18n/assessment";

const ARABIC = /[؀-ۿ]/;

/**
 * Stage 7.1 regression: the assessment wizard had bilingual copy that never
 * activated (broken locale detection) and no completeness guarantee. This
 * enforces the centralized dictionary: every question, hint, and option must
 * have real Arabic (not English fallback), and internal values stay stable.
 */
describe("assessment bilingual dictionary", () => {
  it("every question has distinct EN and AR titles and hints, with real Arabic", () => {
    expect(ASSESSMENT_QUESTIONS.length).toBeGreaterThanOrEqual(9);
    for (const q of ASSESSMENT_QUESTIONS) {
      expect(q.titleEn.trim(), `${q.key}.titleEn`).not.toBe("");
      expect(q.titleAr.trim(), `${q.key}.titleAr`).not.toBe("");
      expect(q.titleAr, `${q.key} title must be translated`).not.toBe(q.titleEn);
      expect(ARABIC.test(q.titleAr), `${q.key}.titleAr must contain Arabic`).toBe(true);
      expect(q.hintAr, `${q.key} hint must be translated`).not.toBe(q.hintEn);
      expect(ARABIC.test(q.hintAr), `${q.key}.hintAr must contain Arabic`).toBe(true);
    }
  });

  it("every option has EN and AR labels while the internal value stays a stable key", () => {
    for (const q of ASSESSMENT_QUESTIONS) {
      for (const o of q.options ?? []) {
        expect(ARABIC.test(o.labelAr), `${q.key}:${o.value}.labelAr`).toBe(true);
        expect(ARABIC.test(o.labelEn), `${q.key}:${o.value}.labelEn must be English`).toBe(false);
        // Internal values are ASCII keys (what the API receives) — never localized.
        expect(o.value).toMatch(/^[a-z0-9+-]+$/i);
      }
    }
  });

  it("selectors return the locale-correct strings", () => {
    const origin = ASSESSMENT_QUESTIONS.find((q) => q.key === "companyOrigin")!;
    expect(questionTitle(origin, "ar")).toBe("هل شركتكم سعودية أم أجنبية؟");
    expect(questionTitle(origin, "en")).toMatch(/Saudi-based or foreign/);
    expect(questionHint(origin, "ar")).toMatch(ARABIC);
    const foreign = origin.options!.find((o) => o.value === "foreign")!;
    expect(optionLabel(foreign, "ar")).toBe("شركة أجنبية");
    expect(optionLabel(foreign, "en")).toBe("Foreign company");
  });

  it("wizard UI copy (buttons, review, states, errors) is complete in both locales", () => {
    const keys = Object.keys(ASSESSMENT_UI.en) as (keyof typeof ASSESSMENT_UI.en)[];
    for (const k of keys) {
      expect(ASSESSMENT_UI.en[k].trim(), `en.${k}`).not.toBe("");
      expect(ASSESSMENT_UI.ar[k].trim(), `ar.${k}`).not.toBe("");
      expect(ARABIC.test(ASSESSMENT_UI.ar[k]), `ar.${k} must contain Arabic`).toBe(true);
    }
  });

  it("Arabic rendering has no English-only question titles (no raw enum display)", () => {
    for (const q of ASSESSMENT_QUESTIONS) {
      const ar = questionTitle(q, "ar");
      // A leaked English title would fail the Arabic-script requirement.
      expect(ARABIC.test(ar), `${q.key} Arabic title leaked English: ${ar}`).toBe(true);
      for (const o of q.options ?? []) {
        expect(optionLabel(o, "ar")).not.toBe(o.value); // never show the raw enum
      }
    }
  });
});
