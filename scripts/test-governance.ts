/**
 * Knowledge-governance integration tests against a live PostgreSQL database.
 * Run: npm run test:governance
 *
 * Covers: audited lifecycle transitions, invalid-transition rejection,
 * publication safety (fail closed), author-cannot-self-approve, legal gate,
 * immutable versioning, staleness marking + engine exclusion, alerts, and
 * immutable historical evaluations.
 */
import { prisma } from "../src/lib/prisma";
import { registerUser } from "../src/lib/auth/register-user";
import { normalizeEmail } from "../src/lib/validation/schemas";
import {
  transitionContent,
  createNewVersion,
  markStaleContent,
  generateAlerts,
  listAlerts,
  type GovernedType,
} from "../src/lib/governance/service";
import type { ContentStatus, GovernanceRole } from "../src/lib/governance/lifecycle";
import { evaluateAssessment } from "../src/lib/rules/service";

function fail(msg: string): never {
  console.error("FAIL:", msg);
  process.exit(1);
}
function ok(msg: string) {
  console.log("OK:", msg);
}
async function expectStatus(fn: () => Promise<unknown>, status: number, label: string) {
  try {
    await fn();
    fail(`${label}: expected throw ${status}, got success`);
  } catch (err) {
    const s = (err as { status?: number }).status;
    if (s !== status) fail(`${label}: expected ${status}, got ${s ?? "none"}`);
  }
}

async function main() {
  if (!process.env.DATABASE_URL) fail("DATABASE_URL not set");
  await prisma.$queryRaw`SELECT 1`;
  const stamp = Date.now();

  // Governance actors (distinct users so separation-of-duties is meaningful).
  const author = await prisma.user.create({ data: { name: "Author", email: `gauth+${stamp}@x.com`, passwordHash: "x" } });
  const reviewer = await prisma.user.create({ data: { name: "Reviewer", email: `grev+${stamp}@x.com`, passwordHash: "x" } });
  const publisher = await prisma.user.create({ data: { name: "Publisher", email: `gpub+${stamp}@x.com`, passwordHash: "x" } });
  const legalReviewer = await prisma.user.create({ data: { name: "Legal", email: `gleg+${stamp}@x.com`, passwordHash: "x" } });
  const authority = await prisma.authority.findFirstOrThrow();

  const advance = (type: GovernedType, entityId: string, to: ContentStatus, actorId: string, actorRole: GovernanceRole) =>
    transitionContent({ type, entityId, toStatus: to, actorId, actorRole, changeReason: "test" });

  async function publishChain(type: GovernedType, id: string) {
    await advance(type, id, "SOURCE_VERIFIED", reviewer.id, "REVIEWER");
    await advance(type, id, "REVIEWED", reviewer.id, "REVIEWER");
    await advance(type, id, "APPROVED", reviewer.id, "REVIEWER");
    await advance(type, id, "PUBLISHED", publisher.id, "PUBLISHER");
  }

  const now = new Date();
  const nextReview = new Date(now.getTime() + 180 * 86400000);

  // Source + pathway + rule (all DRAFT, authored).
  const source = await prisma.officialSource.create({ data: { authorityId: authority.id, title: `Gov Source ${stamp}`, url: "https://misa.gov.sa", domain: "misa.gov.sa", classification: "OFFICIAL_PRIMARY", availability: "AVAILABLE", status: "DRAFT", effectiveDate: now, lastVerified: now, nextReview, authorId: author.id, version: 1 } });
  const pathway = await prisma.pathway.create({ data: { slug: `gov-pw-${stamp}`, titleEn: "Gov PW", titleAr: "مسار", descriptionEn: "d", descriptionAr: "و", status: "DRAFT", authorId: author.id, effectiveDate: now, lastReviewed: now, nextReview } });
  await prisma.pathwaySource.create({ data: { pathwayId: pathway.id, sourceId: source.id } });
  const rule = await prisma.rule.create({ data: { ruleKey: `gov_rule_${stamp}`, version: 1, titleEn: "Gov Rule", titleAr: "قاعدة", explanationEn: "e", explanationAr: "ش", status: "DRAFT", conditions: { op: "all", conditions: [] }, pathwayId: pathway.id, authorId: author.id, requiresVerification: true } });

  // --- Invalid transition rejected ---
  await expectStatus(() => advance("Rule", rule.id, "PUBLISHED", publisher.id, "PUBLISHER"), 409, "DRAFT→PUBLISHED");
  ok("direct DRAFT → PUBLISHED rejected");

  // --- Author cannot self-approve ---
  await advance("OfficialSource", source.id, "SOURCE_VERIFIED", author.id, "AUTHOR");
  await advance("OfficialSource", source.id, "REVIEWED", reviewer.id, "REVIEWER");
  await expectStatus(() => advance("OfficialSource", source.id, "APPROVED", author.id, "REVIEWER"), 403, "self-approve");
  ok("author cannot self-approve");

  // --- Publish the source, then pathway, then rule (audited chain) ---
  await advance("OfficialSource", source.id, "APPROVED", reviewer.id, "REVIEWER");
  await advance("OfficialSource", source.id, "PUBLISHED", publisher.id, "PUBLISHER");
  await publishChain("Pathway", pathway.id);
  await publishChain("Rule", rule.id);
  const history = await prisma.contentReviewHistory.count({ where: { entityId: { in: [source.id, pathway.id, rule.id] } } });
  if (history < 10) fail(`expected audited transitions, found ${history}`);
  ok(`lifecycle transitions audited (${history} review-history rows)`);

  // --- Publication fails closed without a source ---
  const bare = await prisma.pathway.create({ data: { slug: `bare-${stamp}`, titleEn: "Bare", titleAr: "خالٍ", descriptionEn: "d", descriptionAr: "و", status: "DRAFT", authorId: author.id, lastReviewed: now, nextReview } });
  await advance("Pathway", bare.id, "SOURCE_VERIFIED", reviewer.id, "REVIEWER");
  await advance("Pathway", bare.id, "REVIEWED", reviewer.id, "REVIEWER");
  await advance("Pathway", bare.id, "APPROVED", reviewer.id, "REVIEWER");
  await expectStatus(() => advance("Pathway", bare.id, "PUBLISHED", publisher.id, "PUBLISHER"), 422, "publish w/o source");
  ok("publication fails closed without a source");

  // --- Legal-sensitive content requires the legal gate ---
  const legalPw = await prisma.pathway.create({ data: { slug: `legal-pw-${stamp}`, titleEn: "Legal PW", titleAr: "مسار قانوني", descriptionEn: "d", descriptionAr: "و", status: "REVIEWED", requiresProfessionalReview: true, authorId: author.id, lastReviewed: now, nextReview } });
  await expectStatus(() => advance("Pathway", legalPw.id, "APPROVED", reviewer.id, "REVIEWER"), 409, "legal gate");
  await advance("Pathway", legalPw.id, "LEGAL_FLAG_CHECK", legalReviewer.id, "LEGAL_REVIEWER");
  await advance("Pathway", legalPw.id, "APPROVED", legalReviewer.id, "LEGAL_REVIEWER");
  ok("legal-sensitive content requires LEGAL_FLAG_CHECK before approval");

  // --- Immutable versioning ---
  const newVersionId = await createNewVersion({ type: "Rule", entityId: rule.id, actorId: author.id, changeReason: "clarify" });
  const oldRule = await prisma.rule.findUniqueOrThrow({ where: { id: rule.id } });
  const newRule = await prisma.rule.findUniqueOrThrow({ where: { id: newVersionId } });
  if (oldRule.status !== "PUBLISHED") fail("editing changed the published version in place");
  if (newRule.status !== "DRAFT" || newRule.version !== 2 || newRule.previousVersionId !== rule.id) fail("new version not linked/draft");
  ok("editing published content creates a new draft version; history immutable");

  // --- Engine excludes stale-source rules; historical evaluation immutable ---
  const reg = await registerUser({ name: "Gov Owner", email: normalizeEmail(`gowner+${stamp}@example.com`), password: "GovTestPass1", companyName: "G", country: "SA", companyType: "foreign", entryGoal: "setup" });
  if (!reg.ok) fail("owner registration failed");
  const owner = { id: reg.userId };
  const orgId = (await prisma.organizationMembership.findFirstOrThrow({ where: { userId: owner.id } })).organizationId;
  const assessment = await prisma.assessment.create({ data: { userId: owner.id, organizationId: orgId, companyOrigin: "foreign", hasForeignEntity: true, hiringEmployees: false, sellingToGov: false, needsLocalOffice: false, invoiceCustomers: false, sectorLicensing: false } });

  const before = await evaluateAssessment(owner, assessment.id);
  if (!before.output.recommendations.some((r) => r.ruleKey === rule.ruleKey)) fail("governed rule not evaluated while fresh");
  const beforeResultId = before.result.id;

  // Make the backing source stale, then mark stale.
  await prisma.officialSource.update({ where: { id: source.id }, data: { nextReview: new Date(now.getTime() - 86400000) } });
  const staled = await markStaleContent(new Date());
  if (staled < 1) fail("markStaleContent did not stale the overdue source");
  const staleSource = await prisma.officialSource.findUniqueOrThrow({ where: { id: source.id } });
  if (staleSource.status !== "STALE") fail("source not marked STALE");

  const after = await evaluateAssessment(owner, assessment.id);
  if (after.result.id === beforeResultId) fail("stale governance did not regenerate the evaluation");
  if (after.output.recommendations.some((r) => r.ruleKey === rule.ruleKey)) fail("stale-source rule still evaluated");
  if (!after.output.excludedPathways.some((e) => e.ruleKey === rule.ruleKey)) fail("excluded rule missing governance reason");
  if (after.output.governanceSignature === before.output.governanceSignature) fail("governance signature unchanged after staleness");
  const oldEval = await prisma.evaluationResult.findUniqueOrThrow({ where: { id: beforeResultId }, include: { recommendations: true } });
  if (!oldEval.recommendations.some((r) => r.ruleKey === rule.ruleKey)) fail("historical evaluation mutated");
  ok("stale source excluded from new evaluation; historical result immutable; governance signature changed");

  // --- Alerts ---
  await generateAlerts(new Date());
  const alerts = await listAlerts("OPEN");
  if (!alerts.some((a) => a.type === "SOURCE_OVERDUE" && a.entityId === source.id)) fail("overdue source alert missing");
  ok(`operational alerts generated (${alerts.length} open)`);

  // --- Cleanup ---
  await prisma.contentAlert.deleteMany({ where: { entityId: { in: [source.id, pathway.id, rule.id, newVersionId] } } });
  await prisma.recommendation.deleteMany({ where: { assessmentId: assessment.id } });
  await prisma.evaluationResult.deleteMany({ where: { assessmentId: assessment.id } });
  await prisma.assessment.deleteMany({ where: { id: assessment.id } });
  await prisma.contentReviewHistory.deleteMany({ where: { entityId: { in: [source.id, pathway.id, rule.id, newVersionId, bare.id, legalPw.id] } } });
  await prisma.rule.deleteMany({ where: { id: { in: [rule.id, newVersionId] } } });
  await prisma.pathwaySource.deleteMany({ where: { pathwayId: pathway.id } });
  await prisma.pathway.deleteMany({ where: { id: { in: [pathway.id, bare.id, legalPw.id] } } });
  await prisma.officialSource.deleteMany({ where: { id: source.id } });
  await prisma.auditLog.deleteMany({ where: { userId: { in: [author.id, reviewer.id, publisher.id, legalReviewer.id, owner.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [author.id, reviewer.id, publisher.id, legalReviewer.id, owner.id] } } });
  await prisma.organization.deleteMany({ where: { id: orgId } });

  await prisma.$disconnect();
  console.log("\nAll knowledge-governance integration checks passed.");
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
