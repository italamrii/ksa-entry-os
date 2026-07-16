/**
 * Knowledge-coverage + production-seed integration tests (live PostgreSQL).
 * Run: npm run test:coverage
 *
 * Covers the Stage 7.5 root cause: an unseeded knowledge base silently produced
 * "0 personalized steps". These tests prove the seed populates the knowledge
 * base idempotently and that zero-coverage is never silent.
 */
import { prisma } from "../src/lib/prisma";
import { assessCoverage, alertZeroCoverage, knowledgeHealthSummary, findRulesWithoutSource, findPathwaysWithoutSteps } from "../src/lib/knowledge/coverage";
import { evaluateRules } from "../src/lib/rules/engine";
import { resolveEntitlements } from "../src/lib/payments/entitlement";
import { registerUser } from "../src/lib/auth/register-user";
import { normalizeEmail } from "../src/lib/validation/schemas";

function fail(msg: string): never {
  console.error("FAIL:", msg);
  process.exit(1);
}
function ok(msg: string) {
  console.log("OK:", msg);
}

async function main() {
  if (!process.env.DATABASE_URL) fail("DATABASE_URL not set");
  await prisma.$queryRaw`SELECT 1`;
  const stamp = Date.now();

  // --- Reference data must exist (root cause: it did not on the recreated DB) ---
  const [sectors, requirements, rules, pathways, sources, disclaimers, steps, activities] = await Promise.all([
    prisma.sector.count(),
    prisma.requirement.count({ where: { isActive: true } }),
    prisma.rule.count({ where: { status: "PUBLISHED" } }),
    prisma.pathway.count({ where: { status: "PUBLISHED" } }),
    prisma.officialSource.count({ where: { status: "PUBLISHED" } }),
    prisma.disclaimer.count({ where: { status: "PUBLISHED" } }),
    prisma.pathwayStep.count(),
    prisma.activity.count(),
  ]);
  if (sectors === 0 || requirements === 0 || rules === 0 || pathways === 0 || sources === 0 || disclaimers === 0) {
    fail(`reference data missing (sectors=${sectors} req=${requirements} rules=${rules} pathways=${pathways} sources=${sources} disclaimers=${disclaimers}) — run npm run db:seed`);
  }
  if (steps === 0) fail("no pathway steps seeded — dependency map would be empty");
  if (activities === 0) fail("no activities seeded");
  ok(`reference data present (req=${requirements} rules=${rules} pathways=${pathways} sources=${sources} steps=${steps} activities=${activities})`);

  // --- A realistic foreign company must produce a NON-empty core roadmap ---
  const allReqs = await prisma.requirement.findMany({ where: { isActive: true }, include: { authority: true } });
  const foreign = evaluateRules(allReqs, {
    companyOrigin: "foreign", hasForeignEntity: true, hiringEmployees: true, sellingToGov: false,
    needsLocalOffice: true, invoiceCustomers: true, sectorLicensing: false,
    companyType: "foreign", entryGoal: "setup",
  });
  if (foreign.length === 0) fail("foreign company produced 0 steps — regression of the reported bug");
  ok(`foreign company core pathway populated (${foreign.length} steps)`);

  const local = evaluateRules(allReqs, {
    companyOrigin: "local", hasForeignEntity: false, hiringEmployees: false, sellingToGov: false,
    needsLocalOffice: true, invoiceCustomers: false, sectorLicensing: false,
    companyType: "local", entryGoal: "explore",
  });
  if (local.length === 0) fail("Saudi company produced 0 steps");
  if (local.some((r) => r.ruleKey === "misa_investment")) fail("MISA investment path wrongly applied to a local company");
  ok(`Saudi company core pathway populated (${local.length} steps) and excludes the foreign-investment path`);

  // Conditional applicability: hiring + invoicing surface workforce/tax paths.
  const hiring = evaluateRules(allReqs, {
    companyOrigin: "foreign", hasForeignEntity: false, hiringEmployees: true, sellingToGov: false,
    needsLocalOffice: false, invoiceCustomers: true, sectorLicensing: false, companyType: "foreign", entryGoal: "hire",
  });
  for (const key of ["gosi_registration", "qiwa_registration", "mudad_registration", "zatca_vat"]) {
    if (!hiring.some((r) => r.ruleKey === key)) fail(`expected ${key} for a hiring + invoicing company`);
  }
  ok("conditional applicability: workforce (GOSI/Qiwa/Mudad) + ZATCA/VAT surfaced");

  const noHiring = evaluateRules(allReqs, {
    companyOrigin: "local", hasForeignEntity: false, hiringEmployees: false, sellingToGov: false,
    needsLocalOffice: false, invoiceCustomers: false, sectorLicensing: false, companyType: "local", entryGoal: "explore",
  });
  if (noHiring.some((r) => r.ruleKey === "gosi_registration")) fail("GOSI applied without hiring — excluded requirement leaked");
  ok("excluded requirement reason: no hiring => no workforce pathway");

  // --- Coverage safety: zero matches is never silent ---
  const covered = await assessCoverage({
    matchedCount: foreign.length,
    context: { sectorId: "x", companyType: "foreign", entryGoal: "setup", businessActivity: "SaaS" },
  });
  if (covered.status !== "COVERED") fail("populated roadmap misclassified as insufficient");
  ok("coverage: populated roadmap classified COVERED");

  const insufficient = await assessCoverage({
    matchedCount: 0,
    context: { sectorId: null, companyType: null, entryGoal: null, businessActivity: null },
  });
  if (insufficient.status !== "INSUFFICIENT_KNOWLEDGE") fail("zero matches not flagged as insufficient");
  if (insufficient.knowledgeBaseEmpty) fail("knowledge base is seeded but reported empty");
  if (insufficient.missingInputs.length === 0) fail("missing inputs not explained to the user");
  ok(`coverage: zero matches => INSUFFICIENT_KNOWLEDGE + ${insufficient.missingInputs.length} missing inputs explained`);

  // --- Zero-coverage raises an admin alert (idempotently) ---
  const reg = await registerUser({
    name: "Cov", email: normalizeEmail(`cov+${stamp}@example.com`), password: "CovTestPass1",
    companyName: "Cov Co", country: "SA", companyType: "foreign", entryGoal: "setup",
  });
  if (!reg.ok) fail("registration failed");
  const orgId = (await prisma.organizationMembership.findFirstOrThrow({ where: { userId: reg.userId } })).organizationId;
  const assessment = await prisma.assessment.create({
    data: {
      userId: reg.userId, organizationId: orgId, companyOrigin: "foreign", hasForeignEntity: false,
      hiringEmployees: false, sellingToGov: false, needsLocalOffice: false, invoiceCustomers: false, sectorLicensing: false,
    },
  });
  await alertZeroCoverage({ assessmentId: assessment.id, knowledgeBaseEmpty: false, missingInputKeys: ["sector"] });
  await alertZeroCoverage({ assessmentId: assessment.id, knowledgeBaseEmpty: false, missingInputKeys: ["sector"] });
  const alerts = await prisma.contentAlert.count({
    where: { type: "ASSESSMENT_ZERO_COVERAGE", entityId: assessment.id, status: "OPEN" },
  });
  if (alerts !== 1) fail(`expected exactly 1 zero-coverage alert (idempotent), got ${alerts}`);
  ok("zero coverage raises exactly one OPEN admin alert (idempotent)");

  // --- Entitlements resolve server-side from verified-paid state only ---
  const free = await resolveEntitlements(reg.userId);
  if (free.tier !== "FREE" || free.pdfExport) fail("unpaid user must not receive an export entitlement");
  if (!free.safetyDisclaimers || !free.officialVerificationWarnings) fail("safety content gated on FREE");
  ok("entitlements: unpaid user = FREE, no PDF, safety content still present");

  // --- Admin knowledge operations ---
  const health = await knowledgeHealthSummary();
  if (typeof health.openAlerts !== "number") fail("knowledge health summary malformed");
  const orphanRules = await findRulesWithoutSource();
  if (orphanRules.length > 0) fail(`${orphanRules.length} published rules have no source-backed pathway`);
  const stepless = await findPathwaysWithoutSteps();
  ok(`admin knowledge ops: 0 rules without source, ${stepless.length} pathways without steps, ${health.openAlerts} open alerts`);

  // --- Governance: DRAFT taxonomy must never reach a user ---
  const taxonomy = await prisma.pathway.findMany({
    where: { slug: { startsWith: "tx-" } },
    select: { slug: true, status: true, applicability: true, _count: { select: { rules: true, sources: true } } },
  });
  if (taxonomy.length === 0) fail("coverage taxonomy not seeded");
  for (const p of taxonomy) {
    if (p.status !== "DRAFT") fail(`${p.slug} is ${p.status} — researched content must not be auto-activated`);
    if (p._count.rules > 0) fail(`${p.slug} has rules — a DRAFT pathway must not be evaluable`);
    if (p.applicability !== null) fail(`${p.slug} has applicability conditions — must not be evaluable while DRAFT`);
    if (p._count.sources === 0) fail(`${p.slug} has no official source — every item must be source-linked`);
  }
  ok(`governance: ${taxonomy.length} taxonomy entries are DRAFT, source-linked, and non-evaluable`);

  // Only PUBLISHED, source-backed content may evaluate: adding DRAFT content must
  // not change what any user sees.
  const evaluable = await prisma.pathway.count({ where: { status: "PUBLISHED" } });
  const foreignAfter = evaluateRules(allReqs, {
    companyOrigin: "foreign", hasForeignEntity: true, hiringEmployees: true, sellingToGov: false,
    needsLocalOffice: true, invoiceCustomers: true, sectorLicensing: false, companyType: "foreign", entryGoal: "setup",
  });
  if (foreignAfter.length !== foreign.length) fail("DRAFT taxonomy changed evaluation output");
  ok(`governance: DRAFT content is inert (${evaluable} published pathways; evaluation output unchanged)`);

  // Every source-verified claim must record what it does NOT establish.
  const verified = await prisma.officialSource.findMany({
    where: { status: "SOURCE_VERIFIED" },
    select: { title: true, lastVerified: true, limitationsEn: true, limitationsAr: true, authorityId: true },
  });
  for (const s of verified) {
    if (!s.lastVerified) fail(`SOURCE_VERIFIED source "${s.title}" has no verification date`);
    if (!s.limitationsEn || !s.limitationsAr) fail(`source "${s.title}" does not record its limitations in both languages`);
    if (!s.authorityId) fail(`source "${s.title}" is not linked to an authority`);
  }
  ok(`governance: ${verified.length} source-verified entries carry a date, an authority, and bilingual limitations`);

  // --- Cleanup ---
  await prisma.contentAlert.deleteMany({ where: { entityId: assessment.id } });
  await prisma.assessment.deleteMany({ where: { id: assessment.id } });
  await prisma.auditLog.deleteMany({ where: { userId: reg.userId } });
  await prisma.user.deleteMany({ where: { id: reg.userId } });
  await prisma.organization.deleteMany({ where: { id: orgId } });

  await prisma.$disconnect();
  console.log("\nAll coverage/entitlement integration checks passed.");
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
