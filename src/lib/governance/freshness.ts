/**
 * Deterministic freshness / staleness evaluation. Pure — no clock read except
 * the `now` passed in. Governed content becomes stale for explicit, auditable
 * reasons; a stale item must never be silently used in a new evaluation.
 */
import type { ContentStatus } from "@/lib/governance/lifecycle";

export type StaleReasonCode =
  | "REVIEW_OVERDUE"
  | "EFFECTIVE_PERIOD_ENDED"
  | "SUPERSEDED"
  | "SOURCE_UNREACHABLE"
  | "MISSING_VERIFICATION_METADATA"
  | "MARKED_STALE"
  | "RETIRED";

export interface StaleReason {
  code: StaleReasonCode;
  en: string;
  ar: string;
}

export interface FreshnessInput {
  status: ContentStatus;
  nextReview?: Date | null;
  expiryDate?: Date | null;
  lastVerified?: Date | null;
  availability?: "AVAILABLE" | "UNREACHABLE" | "UNKNOWN" | null;
  supersededById?: string | null;
  /** Whether verification metadata (lastVerified + nextReview) is required. */
  requireVerificationMetadata?: boolean;
}

export interface FreshnessResult {
  stale: boolean;
  reasons: StaleReason[];
}

const R = (code: StaleReasonCode, en: string, ar: string): StaleReason => ({ code, en, ar });

export function evaluateFreshness(input: FreshnessInput, now: Date): FreshnessResult {
  const reasons: StaleReason[] = [];

  if (input.status === "RETIRED") {
    reasons.push(R("RETIRED", "Content is retired.", "المحتوى متقاعد."));
  }
  if (input.status === "STALE") {
    reasons.push(R("MARKED_STALE", "Content is marked stale.", "المحتوى موسوم كقديم."));
  }
  if (input.supersededById) {
    reasons.push(R("SUPERSEDED", "Superseded by a newer version.", "استُبدل بإصدار أحدث."));
  }
  if (input.nextReview && input.nextReview.getTime() < now.getTime()) {
    reasons.push(R("REVIEW_OVERDUE", "Review date has passed.", "تجاوز تاريخ المراجعة."));
  }
  if (input.expiryDate && input.expiryDate.getTime() < now.getTime()) {
    reasons.push(R("EFFECTIVE_PERIOD_ENDED", "Effective period has ended.", "انتهت فترة السريان."));
  }
  if (input.availability === "UNREACHABLE") {
    reasons.push(R("SOURCE_UNREACHABLE", "Source is unreachable.", "المصدر غير متاح."));
  }
  if (input.requireVerificationMetadata && (!input.lastVerified || !input.nextReview)) {
    reasons.push(
      R("MISSING_VERIFICATION_METADATA", "Required verification metadata is missing.", "بيانات التحقق المطلوبة مفقودة.")
    );
  }

  return { stale: reasons.length > 0, reasons };
}
