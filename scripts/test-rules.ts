/**
 * Rules-engine integration tests against a live PostgreSQL database (seeded
 * ruleset required: run `npm run db:seed` first). Run: npm run test:rules
 *
 * Covers: seeded evaluation, determinism/reuse, input-change regeneration,
 * rule-version-change regeneration, unpublished/expired rule exclusion,
 * cross-org isolation, immutable historical results, assumptions/risks/sources.
 */
import { prisma } from "../src/lib/prisma";
import { registerUser } from "../src/lib/auth/register-user";
import { normalizeEmail } from "../src/lib/validation/schemas";
import {
  evaluateAssessment,
  getLatestEvaluation,
  buildEvaluationView,
  decideAssumption,
} from "../src/lib/rules/service";

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

  const published = await prisma.rule.count({ where: { status: "PUBLISHED" } });
  if (published < 10) fail(`expected seeded published rules, found ${published} — run npm run db:seed`);

  const stamp = Date.now();
  const regA = await registerUser({ name: "Rule A", email: normalizeEmail(`rulea+${stamp}@example.com`), password: "RuleTestPass1", companyName: "Alpha", country: "SA", companyType: "foreign", entryGoal: "setup" });
  const regB = await registerUser({ name: "Rule B", email: normalizeEmail(`ruleb+${stamp}@example.com`), password: "RuleTestPass1", companyName: "Beta", country: "SA", companyType: "local", entryGoal: "explore" });
  if (!regA.ok || !regB.ok) fail("registration failed");
  const userA = { id: regA.userId };
  const userB = { id: regB.userId };
  const orgA = (await prisma.organizationMembership.findFirstOrThrow({ where: { userId: userA.id } })).organizationId;
  const orgB = (await prisma.organizationMembership.findFirstOrThrow({ where: { userId: userB.id } })).organizationId;

  const assessment = await prisma.assessment.create({
    data: { userId: userA.id, organizationId: orgA, companyOrigin: "foreign", hasForeignEntity: true, hiringEmployees: false, sellingToGov: false, needsLocalOffice: false, invoiceCustomers: false, sectorLicensing: false },
  });

  // --- Seeded evaluation ---
  const first = await evaluateAssessment(userA, assessment.id);
  if (first.reused) fail("first evaluation should not be reused");
  const keys = first.output.recommendations.map((r) => r.ruleKey);
  if (!keys.includes("always") || !keys.includes("misa_investment") || !keys.includes("sbc_setup")) {
    fail(`expected foreign-company pathways, got ${keys.join(",")}`);
  }
  if (keys.includes("gosi_registration")) fail("hiring pathway matched without hiring intent");
  ok(`seeded evaluation matched ${keys.length} pathways from published rules`);

  // Excluded pathways carry a reason
  const excludedHiring = first.output.excludedPathways.find((e) => e.ruleKey === "gosi_registration");
  if (!excludedHiring || !excludedHiring.failedFacts.includes("intent.hiring")) fail("exclusion reason missing");
  ok("excluded pathways include a reason + failed facts");

  // Assumptions, risks, sources, flags preserved
  const misa = first.output.recommendations.find((r) => r.ruleKey === "misa_investment")!;
  if (misa.assumptions.length === 0) fail("misa assumptions not surfaced");
  if (!misa.requiresProfessionalReview) fail("professional-review flag not preserved");
  if (misa.sources.length === 0) fail("source references not preserved");
  if (!first.output.risks.some((r) => r.category === "PROFESSIONAL_REVIEW_NEEDED")) fail("professional-review risk missing");
  ok("assumptions, risks, sources, and flags preserved");

  // --- Determinism / reuse ---
  const second = await evaluateAssessment(userA, assessment.id);
  if (!second.reused) fail("identical inputs should reuse the latest result");
  if (second.result.id !== first.result.id) fail("reuse returned a different result id");
  if (second.output.inputHash !== first.output.inputHash) fail("input hash not deterministic");
  ok("deterministic: identical inputs reuse the same immutable result");

  // --- Input change creates a new result; old result immutable ---
  const firstResultId = first.result.id;
  const firstRecCount = await prisma.recommendation.count({ where: { evaluationResultId: firstResultId } });
  await prisma.assessment.update({ where: { id: assessment.id }, data: { hiringEmployees: true } });
  const third = await evaluateAssessment(userA, assessment.id);
  if (third.reused) fail("changed inputs should regenerate");
  if (third.result.id === firstResultId) fail("regeneration reused old result id");
  if (!third.output.recommendations.some((r) => r.ruleKey === "gosi_registration")) fail("hiring pathway not added after input change");
  const oldRecCount = await prisma.recommendation.count({ where: { evaluationResultId: firstResultId } });
  if (oldRecCount !== firstRecCount) fail("historical recommendations mutated");
  ok("input change regenerates; historical result remains immutable");

  // --- Rule version change creates a new result ---
  const extra = await prisma.rule.create({
    data: { ruleKey: `test_extra_${stamp}`, version: 1, titleEn: "Extra", titleAr: "إضافي", explanationEn: "e", explanationAr: "ش", status: "PUBLISHED", priority: 1, conditions: { op: "all", conditions: [] }, effectiveDate: new Date(), requiresVerification: true },
  });
  const fourth = await evaluateAssessment(userA, assessment.id);
  if (fourth.reused) fail("new published rule should change the ruleset signature");
  if (!fourth.output.recommendations.some((r) => r.ruleKey === extra.ruleKey)) fail("new rule not applied");
  ok("ruleset change (new published rule) regenerates the result");

  // --- Unpublished + expired rules ignored ---
  const draft = await prisma.rule.create({ data: { ruleKey: `test_draft_${stamp}`, version: 1, titleEn: "Draft", titleAr: "مسودة", explanationEn: "e", explanationAr: "ش", status: "DRAFT", conditions: { op: "all", conditions: [] } } });
  const expired = await prisma.rule.create({ data: { ruleKey: `test_expired_${stamp}`, version: 1, titleEn: "Expired", titleAr: "منتهٍ", explanationEn: "e", explanationAr: "ش", status: "PUBLISHED", conditions: { op: "all", conditions: [] }, effectiveDate: new Date(Date.now() - 2 * 86400000), expiryDate: new Date(Date.now() - 86400000) } });
  await prisma.assessment.update({ where: { id: assessment.id }, data: { invoiceCustomers: true } }); // force regen
  const fifth = await evaluateAssessment(userA, assessment.id);
  const fifthKeys = fifth.output.recommendations.map((r) => r.ruleKey);
  if (fifthKeys.includes(draft.ruleKey)) fail("DRAFT rule participated in evaluation");
  if (fifthKeys.includes(expired.ruleKey)) fail("expired rule participated in evaluation");
  ok("unpublished (DRAFT) and expired rules are excluded from evaluation");

  // --- Cross-organization isolation ---
  await expectStatus(() => evaluateAssessment(userB, assessment.id), 404, "cross-org evaluate");
  await expectStatus(() => getLatestEvaluation(userB, assessment.id), 404, "cross-org read");
  ok("cross-organization access blocked (404)");

  // --- Assumption decision + view shape ---
  await decideAssumption(userA, assessment.id, "assume.foreign_ownership", "CONFIRMED");
  const latest = await getLatestEvaluation(userA, assessment.id);
  const view = await buildEvaluationView(latest!);
  if (!Array.isArray(view.recommendations) || !("dependencies" in view) || !("sources" in view)) fail("evaluation view shape invalid");
  if (!view.summary.disclaimer) fail("view missing planning-indicator disclaimer");
  ok("assumption decision recorded + evaluation view is well-formed");

  // --- Cleanup ---
  await prisma.rule.deleteMany({ where: { ruleKey: { in: [extra.ruleKey, draft.ruleKey, expired.ruleKey] } } });
  await prisma.assumptionDecision.deleteMany({ where: { assessmentId: assessment.id } });
  await prisma.recommendation.deleteMany({ where: { assessmentId: assessment.id } });
  await prisma.evaluationResult.deleteMany({ where: { assessmentId: assessment.id } });
  await prisma.assessment.deleteMany({ where: { id: assessment.id } });
  await prisma.auditLog.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
  await prisma.organization.deleteMany({ where: { id: { in: [orgA, orgB] } } });

  await prisma.$disconnect();
  console.log("\nAll rules-engine integration checks passed.");
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
