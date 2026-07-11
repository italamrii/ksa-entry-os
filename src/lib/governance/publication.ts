/**
 * Publication safety. Publishing fails CLOSED when required evidence is missing.
 * Pure over a normalized PublishCandidate so it is fully unit-testable.
 */
import { isAcceptableForProduction, isValidUrl, type SourceClassification } from "@/lib/governance/classification";

export interface PublishCandidate {
  entityType: "Rule" | "Pathway" | "OfficialSource";
  version: number | null;
  hasLocaleEn: boolean;
  hasLocaleAr: boolean;
  applicabilityRecorded: boolean;
  effectiveDate: Date | null;
  lastVerified: Date | null;
  nextReview: Date | null;
  limitationsPresent: boolean;
  professionalReviewRequired: boolean;
  legalFlagResolved: boolean;
  // Source-backing (Rule/Pathway). For OfficialSource these describe itself.
  hasSource: boolean;
  sourceClassification: SourceClassification | null;
  sourceUrl: string | null;
  authorityRecorded: boolean;
  hasStaleDependency: boolean;
  hasUnpublishedDependency: boolean;
}

export interface PublishValidation {
  ok: boolean;
  errors: string[];
}

export function validatePublishable(c: PublishCandidate): PublishValidation {
  const errors: string[] = [];

  if (c.version == null || c.version < 1) errors.push("version must be set");
  if (!c.hasLocaleEn) errors.push("English content is missing");
  if (!c.hasLocaleAr) errors.push("Arabic content is missing");
  if (!c.lastVerified) errors.push("lastVerified date is required");
  if (!c.nextReview) errors.push("nextReview date is required");
  if (c.effectiveDate && c.nextReview && c.effectiveDate.getTime() > c.nextReview.getTime()) {
    errors.push("effectiveDate is after nextReview");
  }

  if (c.entityType === "OfficialSource") {
    if (!c.sourceUrl || !isValidUrl(c.sourceUrl)) errors.push("a valid source URL is required");
    if (!c.sourceClassification || !isAcceptableForProduction(c.sourceClassification)) {
      errors.push("source classification is not acceptable for production");
    }
    if (!c.authorityRecorded) errors.push("issuing authority is required");
  } else {
    // Rules and pathways must be backed by an acceptable, published source.
    if (!c.hasSource) errors.push("at least one official source is required");
    if (c.sourceClassification && !isAcceptableForProduction(c.sourceClassification)) {
      errors.push("linked source classification is not acceptable for production");
    }
    if (c.sourceUrl && !isValidUrl(c.sourceUrl)) errors.push("linked source URL is invalid");
    if (!c.authorityRecorded) errors.push("issuing authority is required");
  }

  if (c.entityType === "Rule" && !c.applicabilityRecorded) {
    errors.push("applicability (conditions) must be recorded");
  }
  if (c.professionalReviewRequired && !c.limitationsPresent) {
    errors.push("limitations are required for professional-review content");
  }
  if (c.professionalReviewRequired && !c.legalFlagResolved) {
    errors.push("legal flag must be resolved before publication");
  }
  if (c.hasStaleDependency) errors.push("a linked dependency is stale");
  if (c.hasUnpublishedDependency) errors.push("a mandatory dependency is not published");

  return { ok: errors.length === 0, errors };
}
