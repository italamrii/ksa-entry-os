/**
 * Centralized, versioned legal/safety copy. Never scatter hardcoded disclaimer
 * strings across routes/components — read them from here (DB-backed, with a
 * safe built-in fallback so a missing row can never drop the guidance boundary).
 */
import { prisma } from "@/lib/prisma";

export type DisclaimerContext =
  | "PLATFORM"
  | "EVALUATION"
  | "REPORT"
  | "EXTERNAL_LINK"
  | "PROFESSIONAL_REVIEW"
  | "OFFICIAL_VERIFICATION"
  | "OUTDATED_INFO";

export interface DisclaimerCopy {
  context: DisclaimerContext;
  version: number;
  textEn: string;
  textAr: string;
}

/** Fallback copy — used only if the DB has no published row for a context. */
export const FALLBACK_DISCLAIMERS: Record<DisclaimerContext, { en: string; ar: string }> = {
  PLATFORM: {
    en: "KSA Entry OS explains and organizes possible pathways and directs users to official sources for verification and execution. It does not represent any authority, execute transactions, guarantee outcomes, or provide binding professional advice.",
    ar: "توضح منصة KSA Entry OS المسارات المحتملة وتنظمها، وتوجه المستخدم إلى المصادر والجهات الرسمية للتحقق والتنفيذ. ولا تمثل المنصة أي جهة، ولا تنفذ المعاملات، ولا تضمن النتائج، ولا تقدم استشارة مهنية ملزمة.",
  },
  EVALUATION: {
    en: "These results are planning indicators generated from your inputs and public sources. They are not eligibility, approval, or official determinations. Verify every requirement with the official authority.",
    ar: "هذه النتائج مؤشرات تخطيطية مبنية على مدخلاتك ومصادر عامة، وليست إثباتًا للأهلية أو الموافقة أو قرارًا رسميًا. تحقق من كل متطلب مع الجهة الرسمية.",
  },
  REPORT: {
    en: "This report organizes possible pathways from public official sources as of the information cutoff date. It is guidance only and must be verified with official authorities or licensed professionals.",
    ar: "ينظّم هذا التقرير المسارات المحتملة من مصادر رسمية عامة حتى تاريخ توقف المعلومات. وهو إرشادي فقط ويجب التحقق منه لدى الجهات الرسمية أو المختصين المرخصين.",
  },
  EXTERNAL_LINK: {
    en: "You are opening an external official source. KSA Entry OS does not control its content and is not affiliated with it.",
    ar: "أنت تفتح مصدرًا رسميًا خارجيًا. لا تتحكم منصة KSA Entry OS في محتواه وليست تابعة له.",
  },
  PROFESSIONAL_REVIEW: {
    en: "This area may require review by an appropriately licensed professional before you act.",
    ar: "قد يتطلب هذا الجانب مراجعة من مختص مرخص مناسب قبل اتخاذ إجراء.",
  },
  OFFICIAL_VERIFICATION: {
    en: "Confirm current requirements directly with the official authority before relying on this information.",
    ar: "أكد المتطلبات الحالية مباشرة مع الجهة الرسمية قبل الاعتماد على هذه المعلومات.",
  },
  OUTDATED_INFO: {
    en: "Some referenced information is past its review date and may be outdated. Re-verify before relying on it.",
    ar: "بعض المعلومات المرجعية تجاوزت تاريخ مراجعتها وقد تكون قديمة. أعد التحقق قبل الاعتماد عليها.",
  },
};

/** Pure selector: newest published disclaimer for a context, or fallback. */
export function pickDisclaimer(
  rows: DisclaimerCopy[],
  context: DisclaimerContext
): DisclaimerCopy {
  const match = rows
    .filter((d) => d.context === context)
    .sort((a, b) => b.version - a.version)[0];
  if (match) return match;
  const fb = FALLBACK_DISCLAIMERS[context];
  return { context, version: 0, textEn: fb.en, textAr: fb.ar };
}

/** Load all published disclaimers (DB), for building report/evaluation copy. */
export async function loadPublishedDisclaimers(): Promise<DisclaimerCopy[]> {
  const rows = await prisma.disclaimer.findMany({ where: { status: "PUBLISHED" } });
  return rows.map((r) => ({ context: r.context, version: r.version, textEn: r.textEn, textAr: r.textAr }));
}

export async function getDisclaimer(context: DisclaimerContext): Promise<DisclaimerCopy> {
  return pickDisclaimer(await loadPublishedDisclaimers(), context);
}
