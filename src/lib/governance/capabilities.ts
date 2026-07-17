import type { GovernanceRole } from "@/lib/governance/lifecycle";

/**
 * Platform-level governance capabilities, derived from User.role.
 *
 * A platform ADMIN (User.role === "ADMIN") is authorized to act in every
 * governance capacity — author, reviewer, legal reviewer, publisher, and
 * governance admin — WITHOUT any bypass of the lifecycle itself:
 * transitionContent() still enforces status-transition validation, the legal
 * gate, publication requirements, and separation of duties, and still writes
 * ContentReviewHistory + AuditLog for every action. "Admin" means fully
 * authorized, not untraceable.
 *
 * Derivation from the platform role (rather than inserting synthetic
 * review-history or role records) keeps a single source of authority and
 * leaves the audit trail truthful about who acted and in which capacity.
 */
const ALL_GOVERNANCE_ROLES: GovernanceRole[] = [
  "AUTHOR",
  "REVIEWER",
  "LEGAL_REVIEWER",
  "PUBLISHER",
  "ADMIN",
];

export function governanceRolesFor(user: { role: string }): GovernanceRole[] {
  return user.role === "ADMIN" ? [...ALL_GOVERNANCE_ROLES] : [];
}

export function hasGovernanceRole(user: { role: string }, role: GovernanceRole): boolean {
  return governanceRolesFor(user).includes(role);
}

/**
 * The capacity a platform admin acts in for a given transition target. Callers
 * pass this as transitionContent()'s actorRole so history records the true
 * capacity (e.g. PUBLISHER when publishing), not a blanket "ADMIN".
 */
export function actingRoleForTransition(
  user: { role: string },
  toStatus: string
): GovernanceRole | null {
  if (user.role !== "ADMIN") return null;
  switch (toStatus) {
    case "SOURCE_VERIFIED":
    case "DRAFT":
      return "AUTHOR";
    case "REVIEWED":
      return "REVIEWER";
    case "LEGAL_FLAG_CHECK":
    case "APPROVED":
      return "LEGAL_REVIEWER";
    case "PUBLISHED":
      return "PUBLISHER";
    default:
      return "ADMIN";
  }
}
