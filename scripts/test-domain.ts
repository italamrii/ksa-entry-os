/**
 * Domain-model integration tests against a live PostgreSQL database.
 * Run: npm run test:domain
 *
 * Covers organizations, memberships, multi-org, cross-org isolation, company
 * profiles, pathway ordering, dependency integrity, source relationships,
 * assessment ownership, report snapshot immutability, and retirement behavior.
 */
import { Prisma } from "@prisma/client";
import { randomBytes } from "crypto";
import { prisma } from "../src/lib/prisma";
import { registerUser } from "../src/lib/auth/register-user";
import { normalizeEmail } from "../src/lib/validation/schemas";
import {
  provisionPersonalOrganization,
  getPrimaryOrganizationId,
  requireOrgAccess,
} from "../src/lib/organizations";

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
    fail(`${label}: expected throw with status ${status}, got success`);
  } catch (err) {
    const s = (err as { status?: number }).status;
    if (s !== status) fail(`${label}: expected status ${status}, got ${s ?? "none"}`);
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("SKIP/FAIL: DATABASE_URL is not set");
    process.exit(1);
  }
  await prisma.$queryRaw`SELECT 1`;

  const stamp = Date.now();
  const created = { userIds: [] as string[], orgIds: [] as string[], pathwayIds: [] as string[] };

  // --- Users + auto-provisioned organizations ---
  const regA = await registerUser({
    name: "Dom A", email: normalizeEmail(`doma+${stamp}@example.com`), password: "DomTestPass1",
    companyName: "Alpha Co", country: "SA", companyType: "foreign", entryGoal: "setup",
  });
  const regB = await registerUser({
    name: "Dom B", email: normalizeEmail(`domb+${stamp}@example.com`), password: "DomTestPass1",
    companyName: "Beta Co", country: "SA", companyType: "local", entryGoal: "hire",
  });
  if (!regA.ok || !regB.ok) fail("registration failed");
  created.userIds.push(regA.userId, regB.userId);

  const orgA = await getPrimaryOrganizationId(regA.userId);
  const orgB = await getPrimaryOrganizationId(regB.userId);
  if (!orgA || !orgB) fail("registration did not provision organizations");
  created.orgIds.push(orgA, orgB);

  const memA = await prisma.organizationMembership.findUniqueOrThrow({
    where: { organizationId_userId: { organizationId: orgA, userId: regA.userId } },
  });
  if (memA.role !== "OWNER") fail("owner role not assigned on provisioning");
  ok("organization creation + OWNER membership on registration");

  // --- Company profile persistence ---
  const profileA = await prisma.companyProfile.findUniqueOrThrow({ where: { organizationId: orgA } });
  if (profileA.companyName !== "Alpha Co" || profileA.originCountry !== "SA" || profileA.companyType !== "foreign") {
    fail("company profile not persisted from registration");
  }
  ok("company profile persistence (separated from auth)");

  // --- User belongs to multiple organizations ---
  const orgA2 = await provisionPersonalOrganization(prisma, { userId: regA.userId, name: "Alpha Co" });
  if (orgA2 !== orgA) fail("provisioning is not idempotent for existing member");
  const secondOrg = await prisma.organization.create({
    data: { name: "Alpha Subsidiary", slug: `alpha-sub-${stamp}` },
  });
  created.orgIds.push(secondOrg.id);
  await prisma.organizationMembership.create({
    data: { organizationId: secondOrg.id, userId: regA.userId, role: "ADMIN" },
  });
  const memberships = await prisma.organizationMembership.count({ where: { userId: regA.userId } });
  if (memberships !== 2) fail(`expected user in 2 orgs, got ${memberships}`);
  ok("user belongs to multiple organizations with distinct roles");

  // --- Cross-organization access blocked ---
  if ((await requireOrgAccess(regA.userId, orgA)) !== "OWNER") fail("owner access denied");
  if ((await requireOrgAccess(regA.userId, secondOrg.id)) !== "ADMIN") fail("admin access denied");
  await expectStatus(() => requireOrgAccess(regA.userId, orgB), 404, "cross-org access");
  await expectStatus(() => requireOrgAccess(regA.userId, secondOrg.id, ["OWNER"]), 403, "insufficient role");
  ok("cross-organization access blocked (404 non-member, 403 wrong role)");

  // --- Pathway with ordered steps + dependencies + sources ---
  const authority = await prisma.authority.findFirstOrThrow();
  const pathway = await prisma.pathway.create({
    data: {
      slug: `pw-${stamp}`, titleEn: "Original Title", titleAr: "عنوان",
      descriptionEn: "d", descriptionAr: "و", status: "PUBLISHED",
      steps: {
        create: [
          { order: 0, titleEn: "S0", titleAr: "خ0", descriptionEn: "d", descriptionAr: "و", authorityId: authority.id },
          { order: 1, titleEn: "S1", titleAr: "خ1", descriptionEn: "d", descriptionAr: "و" },
          { order: 2, titleEn: "S2", titleAr: "خ2", descriptionEn: "d", descriptionAr: "و" },
        ],
      },
    },
    include: { steps: { orderBy: { order: "asc" } } },
  });
  created.pathwayIds.push(pathway.id);
  if (pathway.steps.map((s) => s.order).join(",") !== "0,1,2") fail("pathway step ordering wrong");

  // Unique (pathwayId, order) enforced
  await expectStatus(
    () =>
      prisma.pathwayStep
        .create({ data: { pathwayId: pathway.id, order: 0, titleEn: "dup", titleAr: "x", descriptionEn: "d", descriptionAr: "و" } })
        .catch((e) => {
          throw Object.assign(new Error("dup"), { status: (e as Prisma.PrismaClientKnownRequestError).code === "P2002" ? 409 : 500 });
        }),
    409,
    "duplicate step order"
  );
  ok("pathway ordering + unique(pathwayId, order) integrity");

  // Dependency: S2 depends on S1
  const [s0, s1, s2] = pathway.steps;
  const dep = await prisma.pathwayStepDependency.create({ data: { stepId: s2.id, dependsOnId: s1.id } });
  const depLoaded = await prisma.pathwayStepDependency.findUniqueOrThrow({
    where: { id: dep.id }, include: { step: true, dependsOn: true },
  });
  if (depLoaded.step.pathwayId !== pathway.id || depLoaded.dependsOn.pathwayId !== pathway.id) {
    fail("dependency crosses pathways");
  }
  ok("pathway step dependency integrity");

  // Source relationship
  const source = await prisma.officialSource.create({
    data: {
      authorityId: authority.id, title: "Official Source", url: "https://example.gov.sa",
      language: "en", jurisdiction: "SA", status: "PUBLISHED", lastVerified: new Date(), nextReview: new Date(Date.now() + 86400000),
    },
  });
  await prisma.pathwaySource.create({ data: { pathwayId: pathway.id, sourceId: source.id } });
  const sourcesForPathway = await prisma.pathwaySource.count({ where: { pathwayId: pathway.id } });
  if (sourcesForPathway !== 1) fail("pathway-source relationship missing");
  ok("official source relationship (first-class source with review metadata)");
  void s0;

  // --- Assessment ownership + org isolation ---
  const assessment = await prisma.assessment.create({
    data: {
      userId: regA.userId, organizationId: orgA, companyOrigin: "foreign", hasForeignEntity: true,
      hiringEmployees: false, sellingToGov: false, needsLocalOffice: false, invoiceCustomers: false, sectorLicensing: false,
      answers: { create: [{ key: "companyOrigin", value: "foreign" }, { key: "hasForeignEntity", value: true }] },
    },
    include: { answers: true },
  });
  if (assessment.answers.length !== 2) fail("assessment answers not stored");
  const foreignOrgRead = await prisma.assessment.findFirst({ where: { id: assessment.id, organizationId: orgB } });
  if (foreignOrgRead) fail("assessment readable under wrong organization");
  ok("assessment ownership + organization isolation");

  // --- Recommendation retirement (SetNull preserves history) ---
  const rec = await prisma.recommendation.create({
    data: { assessmentId: assessment.id, pathwayId: pathway.id, reason: "matched", uncertainty: "MEDIUM" },
  });

  // --- Report snapshot immutability ---
  const report = await prisma.report.create({
    data: { organizationId: orgA, createdByUserId: regA.userId, assessmentId: assessment.id, status: "GENERATED" },
  });
  const snapshot = await prisma.reportSnapshot.create({
    data: {
      reportId: report.id, version: 1,
      content: { pathwayTitle: pathway.titleEn, sources: ["https://example.gov.sa"], infoCutoff: "2026-07-11" } as Prisma.InputJsonValue,
    },
  });
  // Mutate the live knowledge the snapshot was built from.
  await prisma.pathway.update({ where: { id: pathway.id }, data: { titleEn: "Changed Title", version: { increment: 1 } } });
  const reloaded = await prisma.reportSnapshot.findUniqueOrThrow({ where: { id: snapshot.id } });
  const content = reloaded.content as { pathwayTitle: string };
  if (content.pathwayTitle !== "Original Title") fail("report snapshot mutated when knowledge changed");
  ok("report snapshot immutability (historical report unchanged)");

  // --- Retirement + Payment→Org RESTRICT ---
  await prisma.pathway.update({ where: { id: pathway.id }, data: { status: "RETIRED", deletedAt: new Date() } });
  const activePathways = await prisma.pathway.count({ where: { id: pathway.id, status: { not: "RETIRED" }, deletedAt: null } });
  if (activePathways !== 0) fail("retired pathway still appears active");

  // Deleting a retired pathway sets recommendation.pathwayId to NULL (history kept)
  await prisma.pathwaySource.deleteMany({ where: { pathwayId: pathway.id } });
  await prisma.pathwayStepDependency.deleteMany({ where: { stepId: { in: [s1.id, s2.id] } } });
  await prisma.pathway.delete({ where: { id: pathway.id } });
  const recAfter = await prisma.recommendation.findUniqueOrThrow({ where: { id: rec.id } });
  if (recAfter.pathwayId !== null) fail("recommendation not preserved via SetNull on pathway delete");
  ok("retirement + SetNull preserves recommendation history");
  created.pathwayIds.pop();

  // Payment->Organization RESTRICT protects financial history
  const req = await prisma.reportRequest.create({ data: { userId: regA.userId, plan: "PROFESSIONAL", status: "PENDING" } });
  await prisma.payment.create({
    data: { userId: regA.userId, organizationId: orgA, requestId: req.id, amount: 499, currency: "SAR", status: "PAID", invoiceNumber: `INV-${randomBytes(6).toString("hex")}` },
  });
  await expectStatus(
    () => prisma.organization.delete({ where: { id: orgA } }).catch((e) => { throw Object.assign(new Error("restrict"), { status: (e as Prisma.PrismaClientKnownRequestError).code === "P2003" ? 409 : 500 }); }),
    409,
    "org delete with payments (RESTRICT)"
  );
  ok("payment->organization RESTRICT protects financial history");

  // --- Content review history (governance) ---
  await prisma.contentReviewHistory.create({
    data: { entityType: "Pathway", entityId: pathway.id, reviewerId: regA.userId, fromStatus: "DRAFT", toStatus: "PUBLISHED", notes: "verified" },
  });
  ok("content review history recorded");

  // --- Cleanup ---
  await prisma.payment.deleteMany({ where: { userId: { in: created.userIds } } });
  await prisma.reportRequest.deleteMany({ where: { userId: { in: created.userIds } } });
  await prisma.report.deleteMany({ where: { organizationId: { in: created.orgIds } } });
  await prisma.recommendation.deleteMany({ where: { id: rec.id } });
  await prisma.assessment.deleteMany({ where: { userId: { in: created.userIds } } });
  await prisma.officialSource.deleteMany({ where: { id: source.id } });
  await prisma.contentReviewHistory.deleteMany({ where: { entityId: { in: created.pathwayIds.concat(pathway.id) } } });
  await prisma.pathway.deleteMany({ where: { id: { in: created.pathwayIds } } });
  await prisma.auditLog.deleteMany({ where: { userId: { in: created.userIds } } });
  await prisma.session.deleteMany({ where: { userId: { in: created.userIds } } });
  await prisma.user.deleteMany({ where: { id: { in: created.userIds } } });
  await prisma.organization.deleteMany({ where: { id: { in: created.orgIds } } });

  await prisma.$disconnect();
  console.log("\nAll domain integration checks passed.");
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
