/**
 * Content lifecycle: the single source of truth for allowed status transitions
 * and the governance role required to perform them. Pure and deterministic.
 *
 * DRAFT → SOURCE_VERIFIED → REVIEWED → LEGAL_FLAG_CHECK → APPROVED → PUBLISHED
 *        → STALE → RETIRED   (with explicit rejection/retirement edges)
 *
 * Creation never implies approval; approval never implies publication; and a
 * direct DRAFT → PUBLISHED transition is impossible.
 */
export type ContentStatus =
  | "DRAFT"
  | "SOURCE_VERIFIED"
  | "REVIEWED"
  | "LEGAL_FLAG_CHECK"
  | "APPROVED"
  | "PUBLISHED"
  | "STALE"
  | "RETIRED";

export type GovernanceRole = "AUTHOR" | "REVIEWER" | "LEGAL_REVIEWER" | "PUBLISHER" | "ADMIN";

export class GovernanceError extends Error {
  status: number;
  errors?: string[];
  constructor(message: string, status = 409, errors?: string[]) {
    super(message);
    this.name = "GovernanceError";
    this.status = status;
    this.errors = errors;
  }
}

const TRANSITIONS: Record<ContentStatus, ContentStatus[]> = {
  DRAFT: ["SOURCE_VERIFIED", "RETIRED"],
  SOURCE_VERIFIED: ["REVIEWED", "DRAFT", "RETIRED"],
  REVIEWED: ["LEGAL_FLAG_CHECK", "APPROVED", "DRAFT", "RETIRED"],
  LEGAL_FLAG_CHECK: ["APPROVED", "REVIEWED", "DRAFT", "RETIRED"],
  APPROVED: ["PUBLISHED", "REVIEWED", "RETIRED"],
  PUBLISHED: ["STALE", "RETIRED"],
  STALE: ["REVIEWED", "RETIRED"],
  RETIRED: [],
};

/** Roles permitted to move content INTO a given status. */
const ROLE_REQUIREMENTS: Record<ContentStatus, GovernanceRole[]> = {
  DRAFT: ["AUTHOR", "REVIEWER", "LEGAL_REVIEWER", "PUBLISHER", "ADMIN"],
  SOURCE_VERIFIED: ["AUTHOR", "REVIEWER", "LEGAL_REVIEWER", "PUBLISHER", "ADMIN"],
  REVIEWED: ["REVIEWER", "LEGAL_REVIEWER", "PUBLISHER", "ADMIN"],
  LEGAL_FLAG_CHECK: ["LEGAL_REVIEWER", "ADMIN"],
  APPROVED: ["REVIEWER", "LEGAL_REVIEWER", "PUBLISHER", "ADMIN"],
  PUBLISHED: ["PUBLISHER", "ADMIN"],
  STALE: ["REVIEWER", "LEGAL_REVIEWER", "PUBLISHER", "ADMIN"],
  RETIRED: ["PUBLISHER", "ADMIN"],
};

export function canTransition(from: ContentStatus, to: ContentStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: ContentStatus, to: ContentStatus): void {
  if (from === to) throw new GovernanceError(`No-op transition ${from} → ${to}`);
  if (!canTransition(from, to)) {
    throw new GovernanceError(`Invalid lifecycle transition ${from} → ${to}`);
  }
}

export function assertRole(role: GovernanceRole, to: ContentStatus): void {
  if (!ROLE_REQUIREMENTS[to].includes(role)) {
    throw new GovernanceError(`Role ${role} may not move content to ${to}`, 403);
  }
}

/**
 * Separation of duties: the author of a record may not approve it (unless an
 * ADMIN override is explicitly used). Applies to the APPROVED transition.
 */
export function assertSeparationOfDuties(
  to: ContentStatus,
  actorId: string,
  authorId: string | null,
  actorRole: GovernanceRole
): void {
  if (to === "APPROVED" && authorId && actorId === authorId && actorRole !== "ADMIN") {
    throw new GovernanceError("Authors cannot approve their own content", 403);
  }
}

/**
 * Legal-sensitive content (professional-review-required) must pass through
 * LEGAL_FLAG_CHECK before it can be APPROVED.
 */
export function assertLegalGate(
  to: ContentStatus,
  from: ContentStatus,
  legalSensitive: boolean
): void {
  if (to === "APPROVED" && legalSensitive && from !== "LEGAL_FLAG_CHECK") {
    throw new GovernanceError(
      "Legal-sensitive content must complete LEGAL_FLAG_CHECK before approval",
      409
    );
  }
}
