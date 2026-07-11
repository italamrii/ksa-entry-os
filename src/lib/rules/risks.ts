/**
 * Deterministic risk derivation. Risks use stable categories, carry severity +
 * rationale + a mitigation/next-verification step, and never imply legal
 * certainty. Derived purely from facts + matched rules + source freshness.
 */
import type { FactSet } from "@/lib/rules/conditions";
import type { EngineRule, Risk } from "@/lib/rules/types";

/** Facts required for a meaningful evaluation; absence => MISSING_INFORMATION. */
const REQUIRED_FACT_KEYS = ["company.origin", "sector.slug", "objective"] as const;

export function deriveRisks(
  facts: FactSet,
  matchedRules: EngineRule[],
  now: Date
): Risk[] {
  const risks: Risk[] = [];

  // Missing information.
  const missing = REQUIRED_FACT_KEYS.filter((k) => facts[k] === undefined || facts[k]?.value == null);
  if (missing.length > 0) {
    risks.push({
      category: "MISSING_INFORMATION",
      severity: missing.length > 1 ? "MEDIUM" : "LOW",
      rationaleEn: `Some context is missing (${missing.join(", ")}), which limits how specific the guidance can be.`,
      rationaleAr: "بعض السياق مفقود، مما يحد من دقة الإرشادات.",
      mitigationEn: "Complete the company profile and assessment to refine results.",
      mitigationAr: "أكمل ملف الشركة والتقييم لتحسين النتائج.",
    });
  }

  // Conflicting inputs.
  if (facts["conflict.ownership"]?.value === true) {
    risks.push({
      category: "CONFLICTING_INPUTS",
      severity: "MEDIUM",
      rationaleEn: "Company type is local but a foreign entity was reported; these inputs may conflict.",
      rationaleAr: "نوع الشركة محلي لكن تم الإبلاغ عن كيان أجنبي؛ قد تتعارض هذه المدخلات.",
      mitigationEn: "Re-check company type and ownership details before proceeding.",
      mitigationAr: "أعد التحقق من نوع الشركة وتفاصيل الملكية قبل المتابعة.",
    });
  }

  // Regulatory sensitivity (inferred regulated activity).
  if (facts["activity.regulated"]?.value === true) {
    risks.push({
      category: "REGULATORY_SENSITIVITY",
      severity: "HIGH",
      rationaleEn: "The selected activity appears to be in a regulated sector.",
      rationaleAr: "يبدو أن النشاط المختار في قطاع منظم.",
      mitigationEn: "Verify sector-specific licensing with the relevant official authority.",
      mitigationAr: "تحقق من الترخيص الخاص بالقطاع مع الجهة الرسمية المختصة.",
    });
  }

  // Per-rule flags.
  let professionalReviewFlagged = false;
  let verificationFlagged = false;
  for (const rule of matchedRules) {
    if (rule.requiresProfessionalReview && !professionalReviewFlagged) {
      professionalReviewFlagged = true;
      risks.push({
        category: "PROFESSIONAL_REVIEW_NEEDED",
        severity: "MEDIUM",
        rationaleEn: "One or more matched pathways touch legal/tax/regulatory areas.",
        rationaleAr: "تتعلق واحدة أو أكثر من المسارات المطابقة بمجالات قانونية/ضريبية/تنظيمية.",
        mitigationEn: "Consult an appropriately licensed professional before acting.",
        mitigationAr: "استشر مختصًا مرخصًا مناسبًا قبل اتخاذ إجراء.",
        ruleKey: rule.ruleKey,
      });
    }
    if (rule.requiresVerification && !verificationFlagged) {
      verificationFlagged = true;
      risks.push({
        category: "OFFICIAL_VERIFICATION_REQUIRED",
        severity: "LOW",
        rationaleEn: "Details should be confirmed against the official source before relying on them.",
        rationaleAr: "يجب تأكيد التفاصيل مقابل المصدر الرسمي قبل الاعتماد عليها.",
        mitigationEn: "Open the linked official source and verify current requirements.",
        mitigationAr: "افتح المصدر الرسمي المرتبط وتحقق من المتطلبات الحالية.",
        ruleKey: rule.ruleKey,
      });
    }
    // Outdated source.
    for (const src of rule.sources) {
      if (src.nextReview && new Date(src.nextReview).getTime() < now.getTime()) {
        risks.push({
          category: "OUTDATED_SOURCE",
          severity: "MEDIUM",
          rationaleEn: `A referenced source is past its review date (${src.title}).`,
          rationaleAr: "تجاوز أحد المصادر المرجعية تاريخ مراجعته.",
          mitigationEn: "Treat this source as potentially outdated and re-verify.",
          mitigationAr: "اعتبر هذا المصدر قد يكون قديمًا وأعد التحقق.",
          ruleKey: rule.ruleKey,
        });
      }
    }
  }

  return risks;
}
