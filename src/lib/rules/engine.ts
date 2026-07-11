import type { Requirement } from "@prisma/client";

export interface AssessmentAnswers {
  companyOrigin: "foreign" | "local";
  hasForeignEntity: boolean;
  sectorId?: string | null;
  sectorSlug?: string | null;
  businessActivity?: string | null;
  hiringEmployees: boolean;
  sellingToGov: boolean;
  needsLocalOffice: boolean;
  invoiceCustomers: boolean;
  sectorLicensing: boolean;
  launchTimeline?: string | null;
  companyType?: string | null;
  entryGoal?: string | null;
}

export function evaluateRules(
  requirements: Requirement[],
  answers: AssessmentAnswers
): Requirement[] {
  const matched: Requirement[] = [];

  for (const req of requirements) {
    if (!req.isActive) continue;
    if (matchesRule(req.ruleKey, answers, req.sectorId, answers.sectorId)) {
      matched.push(req);
    }
  }

  return matched.sort((a, b) => a.order - b.order);
}

function matchesRule(
  ruleKey: string | null,
  answers: AssessmentAnswers,
  reqSectorId: string | null,
  answerSectorId?: string | null
): boolean {
  if (!ruleKey) return false;

  switch (ruleKey) {
    case "always":
      return true;
    case "foreign_company":
      return answers.companyOrigin === "foreign";
    case "local_company":
      return answers.companyOrigin === "local";
    case "foreign_entity_setup":
      return answers.companyOrigin === "foreign" && answers.hasForeignEntity;
    case "misa_investment":
      return answers.companyOrigin === "foreign";
    case "sbc_setup":
      return answers.companyOrigin === "foreign" || answers.needsLocalOffice;
    case "commercial_registration":
      return answers.needsLocalOffice || answers.companyOrigin === "local";
    case "hiring_employees":
      return answers.hiringEmployees;
    case "gosi_registration":
      return answers.hiringEmployees;
    case "qiwa_registration":
      return answers.hiringEmployees;
    case "mudad_registration":
      return answers.hiringEmployees;
    case "zatca_vat":
      return answers.invoiceCustomers;
    case "government_sales":
      return answers.sellingToGov;
    case "local_office":
      return answers.needsLocalOffice;
    case "sector_licensing":
      return answers.sectorLicensing;
    case "sector_food":
      return answers.sectorSlug === "food-beverage";
    case "sector_healthcare":
      return answers.sectorSlug === "healthcare-support";
    case "sector_education":
      return answers.sectorSlug === "education-training";
    case "sector_construction":
      return answers.sectorSlug === "construction";
    case "sector_tourism":
      return answers.sectorSlug === "tourism-events";
    case "sector_recruitment":
      return answers.sectorSlug === "recruitment-hr";
    case "sector_fintech":
      return answers.sectorSlug === "technology-saas" && answers.sectorLicensing;
    case "fast_timeline":
      return answers.launchTimeline === "1-3";
    default:
      if (ruleKey.startsWith("sector:")) {
        const slug = ruleKey.replace("sector:", "");
        return answers.sectorSlug === slug;
      }
      if (reqSectorId && answerSectorId) {
        return reqSectorId === answerSectorId;
      }
      return false;
  }
}

export function getPreviewLimit(isPaid: boolean): number {
  return isPaid ? Infinity : 3;
}
