import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Accepts either the base client or an interactive-transaction client. */
type Db = Prisma.TransactionClient | typeof prisma;

export type OrgRole = "OWNER" | "ADMIN" | "MEMBER" | "REVIEWER";

export interface ProfileSeed {
  companyName?: string | null;
  originCountry?: string | null;
  companyType?: string | null;
  sectorId?: string | null;
  entryGoal?: string | null;
  locale?: string;
  onboardingDone?: boolean;
}

function slugify(base: string): string {
  const s = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return s || "org";
}

function statusError(message: string, status: number): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  return err;
}

/**
 * Provision a personal organization for a user: creates the Organization, an
 * OWNER membership, and the CompanyProfile in one shot. Idempotent — if the
 * user already belongs to an organization, that organization's id is returned
 * and nothing is created.
 */
export async function provisionPersonalOrganization(
  db: Db,
  args: { userId: string; name: string; profile?: ProfileSeed }
): Promise<string> {
  const existing = await db.organizationMembership.findFirst({
    where: { userId: args.userId },
    orderBy: { createdAt: "asc" },
    select: { organizationId: true },
  });
  if (existing) return existing.organizationId;

  const slug = `${slugify(args.name)}-${randomBytes(4).toString("hex")}`;
  const org = await db.organization.create({
    data: {
      name: args.name,
      slug,
      memberships: { create: { userId: args.userId, role: "OWNER" } },
      profile: {
        create: {
          companyName: args.profile?.companyName ?? null,
          originCountry: args.profile?.originCountry ?? null,
          companyType: args.profile?.companyType ?? null,
          sectorId: args.profile?.sectorId ?? null,
          entryGoal: args.profile?.entryGoal ?? null,
          locale: args.profile?.locale ?? "en",
          onboardingDone: args.profile?.onboardingDone ?? false,
        },
      },
    },
    select: { id: true },
  });
  return org.id;
}

/** The user's primary (earliest) organization id, or null if none. */
export async function getPrimaryOrganizationId(userId: string): Promise<string | null> {
  const m = await prisma.organizationMembership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { organizationId: true },
  });
  return m?.organizationId ?? null;
}

/**
 * Resolve the user's primary organization, provisioning one on the fly if the
 * user somehow has none (defensive — every user gets one at registration).
 */
export async function getOrCreatePrimaryOrganizationId(user: {
  id: string;
  name: string;
  companyName?: string | null;
  country?: string | null;
  companyType?: string | null;
  sectorId?: string | null;
  entryGoal?: string | null;
  locale?: string | null;
  onboardingDone?: boolean;
}): Promise<string> {
  const existing = await getPrimaryOrganizationId(user.id);
  if (existing) return existing;
  return provisionPersonalOrganization(prisma, {
    userId: user.id,
    name: user.companyName?.trim() || user.name,
    profile: {
      companyName: user.companyName ?? null,
      originCountry: user.country ?? null,
      companyType: user.companyType ?? null,
      sectorId: user.sectorId ?? null,
      entryGoal: user.entryGoal ?? null,
      locale: user.locale ?? "en",
      onboardingDone: user.onboardingDone ?? false,
    },
  });
}

/** The user's membership in a given organization, or null. */
export async function getUserMembership(userId: string, organizationId: string) {
  return prisma.organizationMembership.findUnique({
    where: { organizationId_userId: { organizationId, userId } },
    select: { role: true, organizationId: true },
  });
}

/**
 * Enforce that the user belongs to the organization. Throws 404 (never leak
 * existence) if they are not a member, and 403 if a required role is not held.
 * Returns the membership role on success.
 */
export async function requireOrgAccess(
  userId: string,
  organizationId: string,
  roles?: OrgRole[]
): Promise<OrgRole> {
  const membership = await getUserMembership(userId, organizationId);
  if (!membership) throw statusError("Not found", 404);
  const role = membership.role as OrgRole;
  if (roles && !roles.includes(role)) throw statusError("Forbidden", 403);
  return role;
}
