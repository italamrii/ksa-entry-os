/**
 * Governance service: audited lifecycle transitions, immutable versioning,
 * publication safety, staleness marking, and operational alerts. All mutations
 * are system-admin gated by the caller; this module enforces the governance
 * rules and records evidence. No network/LLM in the decision path.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import {
  assertTransition,
  assertRole,
  assertSeparationOfDuties,
  assertLegalGate,
  GovernanceError,
  type ContentStatus,
  type GovernanceRole,
} from "@/lib/governance/lifecycle";
import { evaluateFreshness } from "@/lib/governance/freshness";
import { validatePublishable, type PublishCandidate } from "@/lib/governance/publication";
import type { SourceClassification } from "@/lib/governance/classification";

export type GovernedType = "Rule" | "Pathway" | "OfficialSource";

interface GovernedRecord {
  id: string;
  status: ContentStatus;
  version: number;
  authorId: string | null;
  requiresProfessionalReview: boolean;
  raw: Record<string, unknown>;
}

async function loadGoverned(type: GovernedType, id: string): Promise<GovernedRecord> {
  if (type === "Rule") {
    const r = await prisma.rule.findUnique({ where: { id } });
    if (!r) throw new GovernanceError("Not found", 404);
    return { id: r.id, status: r.status, version: r.version, authorId: r.authorId, requiresProfessionalReview: r.requiresProfessionalReview, raw: r as unknown as Record<string, unknown> };
  }
  if (type === "Pathway") {
    const p = await prisma.pathway.findUnique({ where: { id } });
    if (!p) throw new GovernanceError("Not found", 404);
    return { id: p.id, status: p.status, version: p.version, authorId: p.authorId, requiresProfessionalReview: p.requiresProfessionalReview, raw: p as unknown as Record<string, unknown> };
  }
  const s = await prisma.officialSource.findUnique({ where: { id } });
  if (!s) throw new GovernanceError("Not found", 404);
  return { id: s.id, status: s.status, version: s.version, authorId: s.authorId, requiresProfessionalReview: false, raw: s as unknown as Record<string, unknown> };
}

/** Sources backing a pathway (for Rule/Pathway publication + staleness). */
async function pathwaySources(pathwayId: string) {
  const links = await prisma.pathwaySource.findMany({
    where: { pathwayId },
    include: { source: true },
  });
  return links.map((l) => l.source);
}

async function hasLegalCheckEvidence(type: GovernedType, entityId: string, version: number): Promise<boolean> {
  const row = await prisma.contentReviewHistory.findFirst({
    where: { entityType: type, entityId, toStatus: "LEGAL_FLAG_CHECK", OR: [{ entityVersion: version }, { entityVersion: null }] },
  });
  return Boolean(row);
}

async function buildPublishCandidate(type: GovernedType, rec: GovernedRecord, now: Date): Promise<PublishCandidate> {
  const r = rec.raw;
  const legalResolved = !rec.requiresProfessionalReview || (await hasLegalCheckEvidence(type, rec.id, rec.version));

  if (type === "OfficialSource") {
    return {
      entityType: "OfficialSource",
      version: rec.version,
      hasLocaleEn: Boolean(r.title),
      hasLocaleAr: Boolean(r.title),
      applicabilityRecorded: true,
      effectiveDate: (r.effectiveDate as Date) ?? null,
      lastVerified: (r.lastVerified as Date) ?? null,
      nextReview: (r.nextReview as Date) ?? null,
      limitationsPresent: true,
      professionalReviewRequired: false,
      legalFlagResolved: true,
      hasSource: true,
      sourceClassification: r.classification as SourceClassification,
      sourceUrl: (r.url as string) ?? null,
      authorityRecorded: Boolean(r.authorityId),
      hasStaleDependency: false,
      hasUnpublishedDependency: false,
    };
  }

  // Rule / Pathway: resolve backing sources.
  const pathwayId = type === "Pathway" ? rec.id : (r.pathwayId as string | null);
  const sources = pathwayId ? await pathwaySources(pathwayId) : [];
  const publishedSources = sources.filter((s) => s.status === "PUBLISHED");
  const anyStaleSource = publishedSources.some(
    (s) => evaluateFreshness({ status: s.status, nextReview: s.nextReview, availability: s.availability, lastVerified: s.lastVerified, requireVerificationMetadata: true }, now).stale
  );
  const best = publishedSources[0] ?? sources[0] ?? null;

  const isRule = type === "Rule";
  const titleEn = r.titleEn as string;
  const titleAr = r.titleAr as string;
  const bodyEn = (isRule ? r.explanationEn : r.descriptionEn) as string;
  const bodyAr = (isRule ? r.explanationAr : r.descriptionAr) as string;

  return {
    entityType: type,
    version: rec.version,
    hasLocaleEn: Boolean(titleEn) && Boolean(bodyEn),
    hasLocaleAr: Boolean(titleAr) && Boolean(bodyAr),
    applicabilityRecorded: isRule ? r.conditions != null : true,
    effectiveDate: (r.effectiveDate as Date) ?? null,
    lastVerified: (best?.lastVerified as Date) ?? (r.lastReviewed as Date) ?? null,
    nextReview: (best?.nextReview as Date) ?? (r.nextReview as Date) ?? null,
    limitationsPresent: rec.requiresProfessionalReview ? Boolean(r.limitationsEn) : true,
    professionalReviewRequired: rec.requiresProfessionalReview,
    legalFlagResolved: legalResolved,
    hasSource: publishedSources.length > 0,
    sourceClassification: (best?.classification as SourceClassification) ?? null,
    sourceUrl: best?.url ?? null,
    authorityRecorded: Boolean(best?.authorityId),
    hasStaleDependency: anyStaleSource,
    hasUnpublishedDependency: sources.length > 0 && publishedSources.length === 0,
  };
}

export interface TransitionParams {
  type: GovernedType;
  entityId: string;
  toStatus: ContentStatus;
  actorId: string;
  actorRole: GovernanceRole;
  changeReason?: string;
  notes?: string;
}

/** Perform an audited, validated lifecycle transition. */
export async function transitionContent(params: TransitionParams) {
  const now = new Date();
  const rec = await loadGoverned(params.type, params.entityId);
  const from = rec.status;
  const to = params.toStatus;

  assertTransition(from, to);
  assertRole(params.actorRole, to);
  assertSeparationOfDuties(to, params.actorId, rec.authorId, params.actorRole);
  assertLegalGate(to, from, rec.requiresProfessionalReview);

  if (to === "PUBLISHED") {
    const candidate = await buildPublishCandidate(params.type, rec, now);
    const validation = validatePublishable(candidate);
    if (!validation.ok) {
      await raiseAlert("REJECTED_PUBLICATION", params.type, rec.id, "HIGH", {
        en: `Publication blocked: ${validation.errors.join("; ")}`,
        ar: "تم إيقاف النشر: متطلبات ناقصة.",
      });
      throw new GovernanceError("Publication requirements not met", 422, validation.errors);
    }
  }

  await updateStatus(params.type, rec.id, to, params.actorRole, params.changeReason);
  await prisma.contentReviewHistory.create({
    data: {
      entityType: params.type,
      entityId: rec.id,
      entityVersion: rec.version,
      reviewerId: params.actorId,
      reviewerRole: params.actorRole,
      fromStatus: from,
      toStatus: to,
      changeReason: params.changeReason,
      notes: params.notes,
    },
  });
  await createAuditLog({
    userId: params.actorId,
    action: "governance.transition",
    entity: params.type,
    entityId: rec.id,
    metadata: { from, to, role: params.actorRole },
  });

  return { id: rec.id, from, to };
}

async function updateStatus(type: GovernedType, id: string, status: ContentStatus, role: GovernanceRole, changeReason?: string) {
  const data = { status, reviewerRole: role, changeReason } as Record<string, unknown>;
  if (type === "Rule") await prisma.rule.update({ where: { id }, data });
  else if (type === "Pathway") await prisma.pathway.update({ where: { id }, data });
  else await prisma.officialSource.update({ where: { id }, data });
}

/**
 * Create a new DRAFT version of a PUBLISHED record without touching the
 * published one (immutable history). Returns the new draft id.
 */
export async function createNewVersion(params: { type: GovernedType; entityId: string; actorId: string; changeReason: string }): Promise<string> {
  const rec = await loadGoverned(params.type, params.entityId);
  if (rec.status !== "PUBLISHED") throw new GovernanceError("Only published content can be versioned", 409);
  const r = rec.raw;

  if (params.type === "Rule") {
    const created = await prisma.rule.create({
      data: {
        ruleKey: r.ruleKey as string, version: rec.version + 1, titleEn: r.titleEn as string, titleAr: r.titleAr as string,
        explanationEn: r.explanationEn as string, explanationAr: r.explanationAr as string, status: "DRAFT",
        priority: r.priority as number, conditions: r.conditions as Prisma.InputJsonValue, pathwayId: r.pathwayId as string | null,
        assumptions: (r.assumptions ?? []) as Prisma.InputJsonValue, requiresProfessionalReview: rec.requiresProfessionalReview,
        requiresVerification: r.requiresVerification as boolean, authorId: params.actorId, previousVersionId: rec.id, changeReason: params.changeReason,
      },
    });
    await prisma.rule.update({ where: { id: rec.id }, data: { supersededById: created.id } });
    return created.id;
  }
  if (params.type === "Pathway") {
    const created = await prisma.pathway.create({
      data: {
        slug: `${r.slug as string}-v${rec.version + 1}`, titleEn: r.titleEn as string, titleAr: r.titleAr as string,
        descriptionEn: r.descriptionEn as string, descriptionAr: r.descriptionAr as string, status: "DRAFT", version: rec.version + 1,
        complexity: r.complexity as never, riskLevel: r.riskLevel as never, sectorId: r.sectorId as string | null,
        requiresProfessionalReview: rec.requiresProfessionalReview, requiresVerification: r.requiresVerification as boolean,
        authorId: params.actorId, previousVersionId: rec.id, changeReason: params.changeReason,
      },
    });
    await prisma.pathway.update({ where: { id: rec.id }, data: { supersededById: created.id } });
    return created.id;
  }
  const created = await prisma.officialSource.create({
    data: {
      authorityId: r.authorityId as string | null, title: r.title as string, url: r.url as string, domain: r.domain as string | null,
      language: r.language as string, jurisdiction: r.jurisdiction as string, classification: r.classification as never,
      status: "DRAFT", version: rec.version + 1, authorId: params.actorId, previousVersionId: rec.id, changeReason: params.changeReason,
    },
  });
  await prisma.officialSource.update({ where: { id: rec.id }, data: { supersededById: created.id } });
  return created.id;
}

/** Mark overdue/unreachable PUBLISHED sources & pathways STALE (audited). */
export async function markStaleContent(now = new Date()): Promise<number> {
  let count = 0;
  const sources = await prisma.officialSource.findMany({ where: { status: "PUBLISHED" } });
  for (const s of sources) {
    const { stale } = evaluateFreshness({ status: s.status, nextReview: s.nextReview, availability: s.availability, lastVerified: s.lastVerified, requireVerificationMetadata: true }, now);
    if (stale) {
      await prisma.officialSource.update({ where: { id: s.id }, data: { status: "STALE" } });
      await prisma.contentReviewHistory.create({ data: { entityType: "OfficialSource", entityId: s.id, entityVersion: s.version, fromStatus: "PUBLISHED", toStatus: "STALE", changeReason: "auto: review overdue / unreachable" } });
      count++;
    }
  }
  const pathways = await prisma.pathway.findMany({ where: { status: "PUBLISHED" } });
  for (const p of pathways) {
    const { stale } = evaluateFreshness({ status: p.status, nextReview: p.nextReview, lastVerified: p.lastReviewed }, now);
    if (stale) {
      await prisma.pathway.update({ where: { id: p.id }, data: { status: "STALE" } });
      await prisma.contentReviewHistory.create({ data: { entityType: "Pathway", entityId: p.id, entityVersion: p.version, fromStatus: "PUBLISHED", toStatus: "STALE", changeReason: "auto: review overdue" } });
      count++;
    }
  }
  return count;
}

async function raiseAlert(type: Prisma.ContentAlertCreateInput["type"], entityType: string, entityId: string, severity: "LOW" | "MEDIUM" | "HIGH", msg: { en: string; ar: string }, metadata?: Prisma.InputJsonValue) {
  await prisma.contentAlert.upsert({
    where: { type_entityType_entityId_status: { type, entityType, entityId, status: "OPEN" } },
    update: { severity, messageEn: msg.en, messageAr: msg.ar, metadata },
    create: { type, entityType, entityId, severity, status: "OPEN", messageEn: msg.en, messageAr: msg.ar, metadata },
  });
}

/** Scan governed content and (idempotently) raise operational alerts. */
export async function generateAlerts(now = new Date()): Promise<number> {
  let raised = 0;
  const soon = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const sources = await prisma.officialSource.findMany({ where: { status: { in: ["PUBLISHED", "STALE"] } } });
  for (const s of sources) {
    if (s.nextReview && s.nextReview < now) {
      await raiseAlert("SOURCE_OVERDUE", "OfficialSource", s.id, "HIGH", { en: `Source review overdue: ${s.title}`, ar: "مراجعة المصدر متأخرة." }); raised++;
    } else if (s.nextReview && s.nextReview < soon) {
      await raiseAlert("SOURCE_REVIEW_DUE", "OfficialSource", s.id, "MEDIUM", { en: `Source review due soon: ${s.title}`, ar: "مراجعة المصدر قريبًا." }); raised++;
    }
    if (s.availability === "UNREACHABLE") {
      await raiseAlert("SOURCE_UNREACHABLE", "OfficialSource", s.id, "HIGH", { en: `Source unreachable: ${s.title}`, ar: "المصدر غير متاح." }); raised++;
    }
    if (s.status === "PUBLISHED" && (!s.lastVerified || !s.nextReview || !s.authorityId)) {
      await raiseAlert("PUBLISHED_MISSING_METADATA", "OfficialSource", s.id, "HIGH", { en: `Published source missing metadata: ${s.title}`, ar: "مصدر منشور تنقصه بيانات." }); raised++;
    }
  }

  // Published rules linked to a stale/unpublished source.
  const rules = await prisma.rule.findMany({ where: { status: "PUBLISHED" }, include: { pathway: { include: { sources: { include: { source: true } } } } } });
  for (const rule of rules) {
    const srcs = rule.pathway?.sources.map((ps) => ps.source) ?? [];
    const staleSrc = srcs.some((s) => s.status !== "PUBLISHED" || (s.nextReview && s.nextReview < now));
    if (srcs.length === 0 || staleSrc) {
      await raiseAlert("RULE_LINKED_STALE_SOURCE", "Rule", rule.id, "HIGH", { en: `Published rule '${rule.ruleKey}' lacks a fresh published source`, ar: "قاعدة منشورة بلا مصدر منشور حديث." }); raised++;
    }
    if (rule.expiryDate && rule.expiryDate < now) {
      await raiseAlert("EXPIRED_EFFECTIVE_DATE", "Rule", rule.id, "MEDIUM", { en: `Published rule '${rule.ruleKey}' is past its expiry date`, ar: "قاعدة منشورة تجاوزت تاريخ انتهائها." }); raised++;
    }
  }
  return raised;
}

export async function listAlerts(status: "OPEN" | "RESOLVED" = "OPEN") {
  return prisma.contentAlert.findMany({ where: { status }, orderBy: [{ severity: "desc" }, { createdAt: "desc" }] });
}

/** Raise an alert when the engine excludes a published rule for governance. */
export async function alertGovernanceExclusion(ruleId: string, ruleKey: string, reasonEn: string) {
  await raiseAlert("RULE_LINKED_STALE_SOURCE", "Rule", ruleId, "HIGH", {
    en: `Rule '${ruleKey}' excluded from evaluation: ${reasonEn}`,
    ar: `استُبعدت القاعدة '${ruleKey}' من التقييم بسبب مشكلة في الحوكمة.`,
  });
}
