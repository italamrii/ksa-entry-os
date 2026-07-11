import { describe, it, expect } from "vitest";
import {
  evaluateCondition,
  validateCondition,
  RuleConditionError,
  type Condition,
  type FactSet,
} from "@/lib/rules/conditions";
import { normalizeFacts, FACTS_VERSION } from "@/lib/rules/facts";
import { scoreRecommendation } from "@/lib/rules/prioritize";
import { evaluate } from "@/lib/rules/evaluate";
import type { EngineRule } from "@/lib/rules/types";

function facts(overrides: Record<string, unknown>): FactSet {
  const f: FactSet = {};
  for (const [k, v] of Object.entries(overrides)) {
    f[k] = { value: v as never, source: "provided", confidence: "HIGH" };
  }
  return f;
}

function rule(partial: Partial<EngineRule> & { ruleKey: string; conditions: Condition }): EngineRule {
  return {
    version: 1,
    titleEn: "T",
    titleAr: "ت",
    explanationEn: "E",
    explanationAr: "ش",
    priority: 0,
    uncertainty: "MEDIUM",
    requiresProfessionalReview: false,
    requiresVerification: true,
    assumptions: [],
    limitationsEn: null,
    limitationsAr: null,
    pathway: null,
    sources: [],
    ...partial,
  };
}

describe("condition evaluator", () => {
  const f = facts({ origin: "foreign", hiring: true, count: 5, name: "alpha-co" });

  it("evaluates leaf operators", () => {
    expect(evaluateCondition({ op: "eq", fact: "origin", value: "foreign" }, f).matched).toBe(true);
    expect(evaluateCondition({ op: "neq", fact: "origin", value: "local" }, f).matched).toBe(true);
    expect(evaluateCondition({ op: "in", fact: "origin", value: ["foreign", "branch"] }, f).matched).toBe(true);
    expect(evaluateCondition({ op: "nin", fact: "origin", value: ["local"] }, f).matched).toBe(true);
    expect(evaluateCondition({ op: "bool", fact: "hiring", value: true }, f).matched).toBe(true);
    expect(evaluateCondition({ op: "exists", fact: "origin" }, f).matched).toBe(true);
    expect(evaluateCondition({ op: "nexists", fact: "missing" }, f).matched).toBe(true);
    expect(evaluateCondition({ op: "contains", fact: "name", value: "alpha" }, f).matched).toBe(true);
    expect(evaluateCondition({ op: "range", fact: "count", min: 1, max: 10 }, f).matched).toBe(true);
    expect(evaluateCondition({ op: "range", fact: "count", min: 6 }, f).matched).toBe(false);
  });

  it("handles all/any/nested groups", () => {
    expect(evaluateCondition({ op: "all", conditions: [] }, f).matched).toBe(true); // vacuous truth
    expect(evaluateCondition({ op: "any", conditions: [] }, f).matched).toBe(false);
    const nested: Condition = {
      op: "all",
      conditions: [
        { op: "eq", fact: "origin", value: "foreign" },
        { op: "any", conditions: [{ op: "bool", fact: "hiring", value: true }, { op: "eq", fact: "origin", value: "local" }] },
      ],
    };
    expect(evaluateCondition(nested, f).matched).toBe(true);
  });

  it("reports failed facts on non-match", () => {
    const r = evaluateCondition({ op: "eq", fact: "origin", value: "local" }, f);
    expect(r.matched).toBe(false);
    expect(r.failedFacts).toContain("origin");
  });

  it("treats a missing fact as not-satisfied, never an error", () => {
    expect(evaluateCondition({ op: "eq", fact: "nope", value: "x" }, f).matched).toBe(false);
  });

  it("rejects malformed conditions", () => {
    expect(() => validateCondition({ op: "bogus", fact: "x" })).toThrow(RuleConditionError);
    expect(() => validateCondition({ op: "all" })).toThrow(RuleConditionError);
    expect(() => validateCondition({ op: "in", fact: "x", value: "not-array" })).toThrow(RuleConditionError);
    expect(() => validateCondition({ op: "eq", value: "x" })).toThrow(RuleConditionError);
  });
});

describe("normalized facts", () => {
  it("distinguishes provided vs inferred and records version", () => {
    const { facts: f, version } = normalizeFacts(
      { companyType: "foreign", sectorSlug: "healthcare-support", entryGoal: "setup" },
      { companyOrigin: "foreign", hasForeignEntity: true, hiringEmployees: true, sellingToGov: false, needsLocalOffice: false, invoiceCustomers: true, sectorLicensing: false }
    );
    expect(version).toBe(FACTS_VERSION);
    expect(f["company.origin"].source).toBe("provided");
    expect(f["ownership.foreign"].source).toBe("inferred");
    expect(f["ownership.foreign"].value).toBe(true);
    expect(f["activity.regulated"].value).toBe(true); // healthcare-support
  });

  it("detects conflicting ownership inputs", () => {
    const { facts: f } = normalizeFacts(
      { companyType: "local" },
      { companyOrigin: "local", hasForeignEntity: true, hiringEmployees: false, sellingToGov: false, needsLocalOffice: false, invoiceCustomers: false, sectorLicensing: false }
    );
    expect(f["conflict.ownership"].value).toBe(true);
  });

  it("handles missing inputs safely", () => {
    const { facts: f } = normalizeFacts(null, {});
    expect(f["company.origin"]).toBeUndefined();
    expect(f["ownership.foreign"].value).toBe(false);
  });
});

describe("prioritization", () => {
  it("is bounded and exposes contributing factors", () => {
    const r = rule({ ruleKey: "x", conditions: { op: "all", conditions: [] }, priority: 18, requiresProfessionalReview: true, pathway: { id: "p", slug: "s", titleEn: "P", titleAr: "پ", complexity: "HIGH", riskLevel: "HIGH", version: 1, requiresProfessionalReview: true, requiresVerification: true, nextReview: null } });
    const { score, factors } = scoreRecommendation({ rule: r, unresolvedAssumptions: 3 });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(factors.find((x) => x.key === "base")).toBeTruthy();
    expect(factors.reduce((s, x) => s + x.contribution, 0)).toBeGreaterThanOrEqual(0);
  });
});

describe("deterministic evaluation", () => {
  const rules: EngineRule[] = [
    rule({ ruleKey: "foreign", priority: 10, conditions: { op: "eq", fact: "company.origin", value: "foreign" }, pathway: { id: "p1", slug: "pw-foreign", titleEn: "Foreign", titleAr: "أجنبي", complexity: "MEDIUM", riskLevel: "MEDIUM", version: 1, requiresProfessionalReview: false, requiresVerification: true, nextReview: null } }),
    rule({ ruleKey: "hiring", priority: 5, conditions: { op: "bool", fact: "intent.hiring", value: true }, pathway: { id: "p2", slug: "pw-hiring", titleEn: "Hiring", titleAr: "توظيف", complexity: "LOW", riskLevel: "LOW", version: 1, requiresProfessionalReview: false, requiresVerification: true, nextReview: null } }),
  ];
  const f = facts({ "company.origin": "foreign", "intent.hiring": true });
  const now = new Date("2026-07-11T00:00:00Z");

  it("produces identical output for identical inputs", () => {
    const a = evaluate({ facts: f, rules, now });
    const b = evaluate({ facts: f, rules, now });
    expect(a.inputHash).toBe(b.inputHash);
    expect(JSON.stringify(a.recommendations)).toBe(JSON.stringify(b.recommendations));
  });

  it("changes the input hash when facts change", () => {
    const a = evaluate({ facts: f, rules, now });
    const b = evaluate({ facts: facts({ "company.origin": "local" }), rules, now });
    expect(a.inputHash).not.toBe(b.inputHash);
  });

  it("changes the ruleset signature when a rule version changes", () => {
    const a = evaluate({ facts: f, rules, now });
    const bumped = rules.map((r) => (r.ruleKey === "foreign" ? { ...r, version: 2 } : r));
    const b = evaluate({ facts: f, rules: bumped, now });
    expect(a.rulesetSignature).not.toBe(b.rulesetSignature);
    expect(a.inputHash).not.toBe(b.inputHash);
  });

  it("includes matched and excludes unmatched with a reason", () => {
    const out = evaluate({ facts: facts({ "company.origin": "foreign", "intent.hiring": false }), rules, now });
    expect(out.recommendations.map((r) => r.ruleKey)).toContain("foreign");
    const excluded = out.excludedPathways.find((e) => e.ruleKey === "hiring");
    expect(excluded).toBeTruthy();
    expect(excluded?.failedFacts).toContain("intent.hiring");
  });

  it("orders recommendations by priority score then ruleKey", () => {
    const out = evaluate({ facts: f, rules, now });
    const scores = out.recommendations.map((r) => r.priorityScore);
    expect([...scores]).toEqual([...scores].sort((a, b) => b - a));
    expect(out.summary.disclaimer).toMatch(/planning indicators/i);
  });
});
