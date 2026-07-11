import { describe, it, expect } from "vitest";
import {
  canTransition,
  assertTransition,
  assertRole,
  assertSeparationOfDuties,
  assertLegalGate,
  GovernanceError,
} from "@/lib/governance/lifecycle";
import { evaluateFreshness } from "@/lib/governance/freshness";
import { validatePublishable, type PublishCandidate } from "@/lib/governance/publication";
import { isAcceptableForProduction, isValidUrl, extractDomain, classifyByDomain } from "@/lib/governance/classification";
import { pickDisclaimer, FALLBACK_DISCLAIMERS } from "@/lib/governance/disclaimers";

describe("lifecycle transitions", () => {
  it("permits the forward chain step by step", () => {
    expect(canTransition("DRAFT", "SOURCE_VERIFIED")).toBe(true);
    expect(canTransition("SOURCE_VERIFIED", "REVIEWED")).toBe(true);
    expect(canTransition("REVIEWED", "APPROVED")).toBe(true);
    expect(canTransition("APPROVED", "PUBLISHED")).toBe(true);
    expect(canTransition("PUBLISHED", "STALE")).toBe(true);
    expect(canTransition("STALE", "RETIRED")).toBe(true);
  });

  it("forbids a direct DRAFT → PUBLISHED transition", () => {
    expect(canTransition("DRAFT", "PUBLISHED")).toBe(false);
    expect(() => assertTransition("DRAFT", "PUBLISHED")).toThrow(GovernanceError);
  });

  it("forbids arbitrary jumps and no-ops", () => {
    expect(() => assertTransition("DRAFT", "APPROVED")).toThrow(GovernanceError);
    expect(() => assertTransition("RETIRED", "PUBLISHED")).toThrow(GovernanceError);
    expect(() => assertTransition("PUBLISHED", "PUBLISHED")).toThrow(GovernanceError);
  });

  it("enforces role requirements", () => {
    expect(() => assertRole("AUTHOR", "PUBLISHED")).toThrow(GovernanceError); // only PUBLISHER/ADMIN
    expect(() => assertRole("PUBLISHER", "PUBLISHED")).not.toThrow();
    expect(() => assertRole("REVIEWER", "LEGAL_FLAG_CHECK")).toThrow(GovernanceError); // legal only
    expect(() => assertRole("LEGAL_REVIEWER", "LEGAL_FLAG_CHECK")).not.toThrow();
  });

  it("enforces separation of duties for approval", () => {
    expect(() => assertSeparationOfDuties("APPROVED", "u1", "u1", "REVIEWER")).toThrow(GovernanceError);
    expect(() => assertSeparationOfDuties("APPROVED", "u2", "u1", "REVIEWER")).not.toThrow();
    expect(() => assertSeparationOfDuties("APPROVED", "u1", "u1", "ADMIN")).not.toThrow(); // admin override
  });

  it("requires legal flag completion for legal-sensitive approval", () => {
    expect(() => assertLegalGate("APPROVED", "REVIEWED", true)).toThrow(GovernanceError);
    expect(() => assertLegalGate("APPROVED", "LEGAL_FLAG_CHECK", true)).not.toThrow();
    expect(() => assertLegalGate("APPROVED", "REVIEWED", false)).not.toThrow();
  });
});

describe("freshness", () => {
  const now = new Date("2026-07-11T00:00:00Z");
  it("is fresh when in-date and available", () => {
    const r = evaluateFreshness({ status: "PUBLISHED", nextReview: new Date("2026-12-01"), availability: "AVAILABLE", lastVerified: new Date("2026-06-01"), requireVerificationMetadata: true }, now);
    expect(r.stale).toBe(false);
  });
  it("goes stale for overdue review, expiry, superseded, unreachable, missing metadata", () => {
    expect(evaluateFreshness({ status: "PUBLISHED", nextReview: new Date("2026-01-01") }, now).reasons[0].code).toBe("REVIEW_OVERDUE");
    expect(evaluateFreshness({ status: "PUBLISHED", expiryDate: new Date("2026-01-01") }, now).stale).toBe(true);
    expect(evaluateFreshness({ status: "PUBLISHED", supersededById: "x" }, now).stale).toBe(true);
    expect(evaluateFreshness({ status: "PUBLISHED", availability: "UNREACHABLE" }, now).stale).toBe(true);
    expect(evaluateFreshness({ status: "PUBLISHED", requireVerificationMetadata: true }, now).stale).toBe(true);
    expect(evaluateFreshness({ status: "RETIRED" }, now).stale).toBe(true);
  });
});

describe("publication safety (fails closed)", () => {
  const base: PublishCandidate = {
    entityType: "Rule", version: 1, hasLocaleEn: true, hasLocaleAr: true, applicabilityRecorded: true,
    effectiveDate: new Date("2026-01-01"), lastVerified: new Date("2026-06-01"), nextReview: new Date("2026-12-01"),
    limitationsPresent: true, professionalReviewRequired: false, legalFlagResolved: true,
    hasSource: true, sourceClassification: "OFFICIAL_PRIMARY", sourceUrl: "https://misa.gov.sa", authorityRecorded: true,
    hasStaleDependency: false, hasUnpublishedDependency: false,
  };
  it("passes with complete evidence", () => {
    expect(validatePublishable(base).ok).toBe(true);
  });
  it("fails without a source", () => {
    expect(validatePublishable({ ...base, hasSource: false }).errors.join()).toMatch(/official source/i);
  });
  it("fails without lastVerified / nextReview", () => {
    expect(validatePublishable({ ...base, lastVerified: null }).ok).toBe(false);
    expect(validatePublishable({ ...base, nextReview: null }).ok).toBe(false);
  });
  it("fails with a stale or unpublished dependency", () => {
    expect(validatePublishable({ ...base, hasStaleDependency: true }).ok).toBe(false);
    expect(validatePublishable({ ...base, hasUnpublishedDependency: true }).ok).toBe(false);
  });
  it("fails legal-sensitive content without limitations or legal resolution", () => {
    expect(validatePublishable({ ...base, professionalReviewRequired: true, limitationsPresent: false }).ok).toBe(false);
    expect(validatePublishable({ ...base, professionalReviewRequired: true, legalFlagResolved: false }).ok).toBe(false);
  });
  it("rejects unacceptable source classification for production", () => {
    expect(validatePublishable({ ...base, sourceClassification: "INTERNAL_INTERPRETATION" }).ok).toBe(false);
  });
});

describe("source classification", () => {
  it("gates production-acceptable classes", () => {
    expect(isAcceptableForProduction("OFFICIAL_PRIMARY")).toBe(true);
    expect(isAcceptableForProduction("GOVERNMENT_PORTAL")).toBe(true);
    expect(isAcceptableForProduction("INTERNAL_INTERPRETATION")).toBe(false);
    expect(isAcceptableForProduction("PROFESSIONAL_REFERENCE")).toBe(false);
  });
  it("validates URLs and derives domains conservatively", () => {
    expect(isValidUrl("https://misa.gov.sa")).toBe(true);
    expect(isValidUrl("ftp://x")).toBe(false);
    expect(isValidUrl("not a url")).toBe(false);
    expect(extractDomain("https://zatca.gov.sa/x")).toBe("zatca.gov.sa");
    expect(classifyByDomain("misa.gov.sa")).toBe("OFFICIAL_PRIMARY");
    expect(classifyByDomain("business.sa")).toBe("GOVERNMENT_PORTAL");
    expect(classifyByDomain("random-blog.com")).toBe("INTERNAL_INTERPRETATION");
  });
});

describe("disclaimers", () => {
  it("picks the newest published version, else falls back", () => {
    const rows = [
      { context: "REPORT" as const, version: 1, textEn: "v1", textAr: "n1" },
      { context: "REPORT" as const, version: 2, textEn: "v2", textAr: "n2" },
    ];
    expect(pickDisclaimer(rows, "REPORT").version).toBe(2);
    const fb = pickDisclaimer([], "PLATFORM");
    expect(fb.version).toBe(0);
    expect(fb.textEn).toBe(FALLBACK_DISCLAIMERS.PLATFORM.en);
  });
});
