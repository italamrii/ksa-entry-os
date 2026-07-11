/**
 * Source-quality classification helpers. Only official / regulator / government
 * portal classes may directly back production regulatory claims.
 */
export type SourceClassification =
  | "OFFICIAL_PRIMARY"
  | "OFFICIAL_SECONDARY"
  | "REGULATOR_GUIDANCE"
  | "GOVERNMENT_PORTAL"
  | "PROFESSIONAL_REFERENCE"
  | "INTERNAL_INTERPRETATION";

export const PRODUCTION_SOURCE_CLASSIFICATIONS: ReadonlySet<SourceClassification> = new Set([
  "OFFICIAL_PRIMARY",
  "OFFICIAL_SECONDARY",
  "REGULATOR_GUIDANCE",
  "GOVERNMENT_PORTAL",
]);

export function isAcceptableForProduction(classification: SourceClassification): boolean {
  return PRODUCTION_SOURCE_CLASSIFICATIONS.has(classification);
}

/** Validate URL format. Only http(s) URLs are accepted. */
export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function extractDomain(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Conservative default classification from a domain. Never upgrades an unknown
 * domain to "official" — unknown domains default to INTERNAL_INTERPRETATION and
 * must be explicitly reclassified by a reviewer.
 */
export function classifyByDomain(domain: string | null): SourceClassification {
  if (!domain) return "INTERNAL_INTERPRETATION";
  const d = domain.toLowerCase();
  if (d.endsWith(".gov.sa")) return "OFFICIAL_PRIMARY";
  if (d === "business.sa" || d.endsWith(".business.sa")) return "GOVERNMENT_PORTAL";
  if (d === "qiwa.sa" || d === "mudad.com.sa") return "GOVERNMENT_PORTAL";
  return "INTERNAL_INTERPRETATION";
}
