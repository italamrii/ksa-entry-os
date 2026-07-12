/**
 * Pure adapters: Stage 4 evaluation + Stage 4.5 governance output → localized
 * view models. These functions ONLY select, localize, and reshape data the
 * backend already produced. They never evaluate rules, derive risks, score
 * pathways, or make governance decisions.
 */
import type {
  AssumptionVM,
  AuthorityVM,
  Complexity,
  DependencyVM,
  EvaluationViewInput,
  ExecutiveSummaryVM,
  FactVM,
  FreshnessState,
  Locale,
  NextActionVM,
  PathwayVM,
  PlanningIndicatorVM,
  ReportSummaryVM,
  RiskVM,
  SourceVM,
  WorkspaceContext,
  WorkspaceViewModel,
} from "@/lib/view-models/types";

const pick = (locale: Locale, en: string, ar: string) => (locale === "ar" ? ar || en : en);

const SEVERITY_LABEL = {
  en: { LOW: "Low", MEDIUM: "Medium", HIGH: "High" },
  ar: { LOW: "منخفض", MEDIUM: "متوسط", HIGH: "مرتفع" },
} as const;

const CATEGORY_LABEL: Record<string, { en: string; ar: string }> = {
  MISSING_INFORMATION: { en: "Missing information", ar: "معلومات ناقصة" },
  REGULATORY_SENSITIVITY: { en: "Regulatory sensitivity", ar: "حساسية تنظيمية" },
  DEPENDENCY_UNRESOLVED: { en: "Unresolved dependency", ar: "اعتماد غير محسوم" },
  PROFESSIONAL_REVIEW_NEEDED: { en: "Professional review needed", ar: "تلزم مراجعة مهنية" },
  OFFICIAL_VERIFICATION_REQUIRED: { en: "Official verification required", ar: "يلزم تحقق رسمي" },
  OUTDATED_SOURCE: { en: "Outdated source", ar: "مصدر قديم" },
  CONFLICTING_INPUTS: { en: "Conflicting inputs", ar: "مدخلات متعارضة" },
};

function planningLabel(locale: Locale, score: number): string {
  if (score >= 70) return pick(locale, "Higher planning priority", "أولوية تخطيط أعلى");
  if (score >= 40) return pick(locale, "Moderate planning priority", "أولوية تخطيط متوسطة");
  return pick(locale, "Lower planning priority", "أولوية تخطيط أقل");
}

function factValue(locale: Locale, value: unknown): string {
  if (typeof value === "boolean") return value ? pick(locale, "Yes", "نعم") : pick(locale, "No", "لا");
  if (value == null) return pick(locale, "Not provided", "غير متوفر");
  return String(value);
}

function deriveFreshness(source: { stale: boolean; status: string; nextReview: string | null } | null, now: Date): FreshnessState {
  if (!source) return "MISSING";
  if (source.stale || source.status !== "PUBLISHED") return "STALE";
  if (source.nextReview && new Date(source.nextReview).getTime() < now.getTime()) return "REVIEW_DUE";
  return "FRESH";
}

function toSourceVM(locale: Locale, s: EvaluationViewInput["sources"][number], now: Date): SourceVM {
  return {
    id: s.id,
    title: s.title,
    authority: s.authority,
    classification: s.classification,
    url: s.url,
    language: s.language ?? "en",
    version: s.version,
    lastVerified: s.lastVerified,
    nextReview: s.nextReview,
    freshness: deriveFreshness(s, now),
    external: true,
  };
}

function planningFromRec(locale: Locale, rec: EvaluationViewInput["recommendations"][number], disclaimer: string): PlanningIndicatorVM | null {
  if (rec.priorityScore == null) return null;
  const factors = Array.isArray(rec.priorityFactors)
    ? (rec.priorityFactors as { labelEn?: string; labelAr?: string; contribution: number }[]).map((f) => ({
        label: pick(locale, f.labelEn ?? "", f.labelAr ?? ""),
        contribution: f.contribution,
      }))
    : [];
  return { score: rec.priorityScore, label: planningLabel(locale, rec.priorityScore), factors, disclaimer };
}

export function buildWorkspaceViewModel(
  view: EvaluationViewInput | null,
  ctx: WorkspaceContext,
  locale: Locale,
  now: Date = new Date()
): WorkspaceViewModel {
  const dir = locale === "ar" ? "rtl" : "ltr";

  const assumptions: AssumptionVM[] = (view?.assumptions ?? []).map((a) => ({
    key: a.key,
    statement: pick(locale, a.textEn, a.textAr),
    impactIfFalse: pick(locale, a.impactIfFalseEn, a.impactIfFalseAr),
    confidence: a.confidence,
    affectedPathwayKey: a.ruleKey ?? null,
  }));

  const risks: RiskVM[] = (view?.risks ?? []).map((r) => ({
    category: CATEGORY_LABEL[r.category] ? pick(locale, CATEGORY_LABEL[r.category].en, CATEGORY_LABEL[r.category].ar) : r.category,
    severity: r.severity,
    rationale: pick(locale, r.rationaleEn, r.rationaleAr),
    mitigation: pick(locale, r.mitigationEn, r.mitigationAr),
    affectedPathwayKey: r.ruleKey ?? null,
  }));

  const sources: SourceVM[] = (view?.sources ?? []).map((s) => toSourceVM(locale, s, now));

  const included: PathwayVM[] = (view?.recommendations ?? []).map((rec) => {
    const reasoning = (rec.reasoning ?? {}) as {
      triggeredFacts?: { key: string; value: unknown; source: "provided" | "inferred"; confidence: FactVM["confidence"] }[];
      localized?: { en: string; ar: string };
      sources?: EvaluationViewInput["sources"];
    };
    const triggeredFacts: FactVM[] = (reasoning.triggeredFacts ?? []).map((f) => ({
      key: f.key,
      label: labelForFact(view, f.key, locale),
      value: factValue(locale, f.value),
      source: f.source,
      confidence: f.confidence,
    }));
    return {
      id: rec.pathwayId,
      ruleKey: rec.ruleKey,
      title: titleFromReasoning(rec, locale).title,
      included: true,
      reason: reasoning.localized ? pick(locale, reasoning.localized.en, reasoning.localized.ar) : rec.reason,
      planning: planningFromRec(locale, rec, view?.summary.disclaimer ?? ""),
      complexity: complexityFromFactors(rec) as Complexity | null,
      uncertainty: rec.uncertainty,
      verification: { requiresVerification: rec.requiresVerification, requiresProfessionalReview: rec.requiresProfessionalReview },
      triggeredFacts,
      assumptions: assumptions.filter((a) => a.affectedPathwayKey === rec.ruleKey),
      risks: risks.filter((r) => r.affectedPathwayKey === rec.ruleKey),
      sources: (reasoning.sources ?? []).map((s) => toSourceVM(locale, s, now)),
      failedFacts: [],
    };
  });

  const excluded: PathwayVM[] = (view?.excludedPathways ?? []).map((e) => ({
    id: null,
    ruleKey: e.ruleKey,
    title: e.pathwaySlug ?? e.ruleKey,
    included: false,
    reason: pick(locale, e.reasonEn, e.reasonAr),
    planning: null,
    complexity: null,
    uncertainty: "MEDIUM",
    verification: { requiresVerification: false, requiresProfessionalReview: false },
    triggeredFacts: [],
    assumptions: [],
    risks: [],
    sources: [],
    failedFacts: e.failedFacts,
  }));

  const dependencies: DependencyVM[] = (view?.dependencies ?? []).map((d) => ({
    pathwayId: d.pathwayId,
    stepId: d.stepId,
    order: d.order,
    title: pick(locale, d.titleEn, d.titleAr),
    dependsOn: d.dependsOn,
    verification: { requiresVerification: d.requiresVerification, requiresProfessionalReview: d.requiresProfessionalReview },
  }));

  const authorities = buildAuthorities(included);

  const nextActions: NextActionVM[] = (view?.nextActions ?? []).map((n) => ({
    ruleKey: n.ruleKey,
    title: pick(locale, n.titleEn, n.titleAr),
    reason: included.find((p) => p.ruleKey === n.ruleKey)?.reason ?? "",
    priority: n.order,
    officialSourceUrl: n.officialSourceUrl,
    verification: { requiresVerification: n.requiresVerification, requiresProfessionalReview: n.requiresProfessionalReview },
  }));

  const provided: FactVM[] = view ? factList(view, locale, "provided") : [];
  const inferred: FactVM[] = view ? factList(view, locale, "inferred") : [];

  const leading = included[0] ?? null;
  const worstFreshness = sources.reduce<FreshnessState>((acc, s) => rankFreshness(s.freshness) > rankFreshness(acc) ? s.freshness : acc, sources.length ? "FRESH" : "MISSING");

  const summary: ExecutiveSummaryVM = {
    companyName: ctx.companyName,
    country: ctx.country,
    companyType: ctx.companyType,
    entryGoal: ctx.entryGoal,
    hasAssessment: ctx.hasAssessment,
    leadingPathwayTitle: leading?.title ?? null,
    planning: leading?.planning ?? null,
    complexity: leading?.complexity ?? null,
    unresolvedAssumptions: assumptions.length,
    keyRisks: risks.filter((r) => r.severity === "HIGH").slice(0, 3),
    verification: {
      requiresVerification: view?.summary.officialVerificationRequired ?? false,
      requiresProfessionalReview: view?.summary.professionalReviewRequired ?? false,
    },
    sourceFreshness: worstFreshness,
    nextActionTitle: nextActions[0]?.title ?? null,
    informationCutoff: view ? toIso(view.informationCutoff) : null,
  };

  const report: ReportSummaryVM = {
    scope: pick(locale, "Saudi market-entry pathways", "مسارات دخول السوق السعودي"),
    informationCutoff: view ? toIso(view.informationCutoff) : null,
    disclaimer: view?.summary.disclaimer ?? "",
    pathwayCount: included.length,
    assumptionCount: assumptions.length,
    riskCount: risks.length,
    sourceCount: sources.length,
    generationStatus: view ? "AVAILABLE" : "NONE",
  };

  return {
    locale,
    dir,
    summary,
    context: { provided, inferred },
    includedPathways: included,
    excludedPathways: excluded,
    dependencies,
    authorities,
    assumptions,
    risks,
    sources,
    nextActions,
    report,
    disclaimer: view?.summary.disclaimer ?? "",
  };
}

// --- helpers ---

function toIso(d: string | Date): string {
  return typeof d === "string" ? d : d.toISOString();
}

function labelForFact(view: EvaluationViewInput | null, key: string, locale: Locale): string {
  const f = view?.facts[key];
  if (!f) return key;
  return pick(locale, f.labelEn ?? key, f.labelAr ?? key);
}

function factList(view: EvaluationViewInput, locale: Locale, source: "provided" | "inferred"): FactVM[] {
  return Object.entries(view.facts)
    .filter(([, f]) => f.source === source)
    .map(([key, f]) => ({
      key,
      label: pick(locale, f.labelEn ?? key, f.labelAr ?? key),
      value: factValue(locale, f.value),
      source: f.source,
      confidence: f.confidence,
    }))
    .sort((a, b) => a.key.localeCompare(b.key));
}

function titleFromReasoning(rec: EvaluationViewInput["recommendations"][number], locale: Locale): { title: string } {
  // The recommendation's localized reasoning is the executive sentence; the
  // short title is the rule key made readable. Real pathway titles live in the
  // reasoning payload's localized text — use the rule key as a stable label.
  const key = rec.ruleKey.replace(/_/g, " ");
  void locale;
  return { title: key.charAt(0).toUpperCase() + key.slice(1) };
}

function complexityFromFactors(rec: EvaluationViewInput["recommendations"][number]): string | null {
  const factors = Array.isArray(rec.priorityFactors) ? (rec.priorityFactors as { key?: string; labelEn?: string }[]) : [];
  const c = factors.find((f) => f.key === "complexity");
  if (!c?.labelEn) return null;
  const m = /\((low|medium|high)\)/i.exec(c.labelEn);
  return m ? (m[1].toUpperCase() as string) : null;
}

function buildAuthorities(pathways: PathwayVM[]): AuthorityVM[] {
  const map = new Map<string, { count: number; keys: Set<string> }>();
  for (const p of pathways) {
    for (const s of p.sources) {
      if (!s.authority) continue;
      const entry = map.get(s.authority) ?? { count: 0, keys: new Set<string>() };
      entry.count += 1;
      entry.keys.add(p.ruleKey);
      map.set(s.authority, entry);
    }
  }
  return [...map.entries()]
    .map(([name, v]) => ({ name, sourceCount: v.count, pathwayKeys: [...v.keys] }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

const FRESHNESS_RANK: Record<FreshnessState, number> = { FRESH: 0, REVIEW_DUE: 1, MISSING: 2, STALE: 3 };
function rankFreshness(f: FreshnessState): number {
  return FRESHNESS_RANK[f];
}

export { SEVERITY_LABEL };
