/**
 * Ordered pathway steps, dependencies, and the activity taxonomy.
 *
 * These are derived from the ALREADY-APPROVED requirement content seeded in
 * seed.ts — no new regulatory claims are introduced here. Each step inherits its
 * pathway's authority/source backing and its verification + professional-review
 * flags, and every step routes the user to the official channel rather than
 * collecting documents in-platform.
 *
 * Idempotent: upsert/find-guarded, never deletes.
 */
import type { PrismaClient } from "@prisma/client";

interface StepSeed {
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

/** pathway slug -> ordered steps (dependencies are sequential within a pathway). */
const PATHWAY_STEPS: Record<string, StepSeed[]> = {
  "pw-misa-foreign-investment": [
    {
      titleEn: "Confirm activity eligibility for foreign ownership",
      titleAr: "التأكد من أهلية النشاط للملكية الأجنبية",
      descriptionEn: "Check with the Ministry of Investment whether the intended activity is open to foreign investors, and under what ownership structure.",
      descriptionAr: "تحقق مع وزارة الاستثمار مما إذا كان النشاط المقصود متاحًا للمستثمرين الأجانب، وبأي هيكل ملكية.",
    },
    {
      titleEn: "Identify the investor document category",
      titleAr: "تحديد فئة مستندات المستثمر",
      descriptionEn: "Identify which category of corporate documents the investment licence application expects. Submit them in the official portal — the platform never collects them.",
      descriptionAr: "حدّد فئة مستندات الشركة التي يتطلبها طلب رخصة الاستثمار. قدّمها عبر البوابة الرسمية — لا تجمعها المنصة.",
    },
    {
      titleEn: "Apply for the investment licence",
      titleAr: "التقديم على رخصة الاستثمار",
      descriptionEn: "Submit the investment licence application through the official channel and track its status there.",
      descriptionAr: "قدّم طلب رخصة الاستثمار عبر القناة الرسمية وتابع حالته هناك.",
    },
  ],
  "pw-sbc-business-setup": [
    {
      titleEn: "Review the unified business-setup journey",
      titleAr: "مراجعة رحلة تأسيس الأعمال الموحدة",
      descriptionEn: "Use the Saudi Business Center to review the consolidated setup steps that apply to your activity.",
      descriptionAr: "استخدم مركز الأعمال السعودي لمراجعة خطوات التأسيس الموحدة المنطبقة على نشاطك.",
    },
    {
      titleEn: "Reserve a trade name",
      titleAr: "حجز الاسم التجاري",
      descriptionEn: "Reserve the intended trade name through the official portal before registration.",
      descriptionAr: "احجز الاسم التجاري المقصود عبر البوابة الرسمية قبل التسجيل.",
    },
  ],
  "pw-commercial-registration": [
    {
      titleEn: "Align the activity classification",
      titleAr: "مواءمة تصنيف النشاط",
      descriptionEn: "Confirm the commercial-registration activity classification that matches your intended operations.",
      descriptionAr: "أكّد تصنيف نشاط السجل التجاري المطابق لعملياتك المقصودة.",
    },
    {
      titleEn: "Issue the commercial registration",
      titleAr: "إصدار السجل التجاري",
      descriptionEn: "Complete commercial registration through the Ministry of Commerce channel appropriate to your entity type.",
      descriptionAr: "أكمل السجل التجاري عبر قناة وزارة التجارة المناسبة لنوع كيانك.",
    },
    {
      titleEn: "Record the national address",
      titleAr: "تسجيل العنوان الوطني",
      descriptionEn: "Register the national address associated with the commercial record.",
      descriptionAr: "سجّل العنوان الوطني المرتبط بالسجل التجاري.",
    },
  ],
  "pw-gosi-employer": [
    {
      titleEn: "Register the establishment with GOSI",
      titleAr: "تسجيل المنشأة في التأمينات",
      descriptionEn: "Register the establishment for social-insurance purposes once the commercial record exists.",
      descriptionAr: "سجّل المنشأة لأغراض التأمينات الاجتماعية بعد وجود السجل التجاري.",
    },
    {
      titleEn: "Enrol employees",
      titleAr: "تسجيل الموظفين",
      descriptionEn: "Add employees to the establishment social-insurance file as they are hired.",
      descriptionAr: "أضف الموظفين إلى ملف التأمينات الخاص بالمنشأة عند توظيفهم.",
    },
  ],
  "pw-qiwa-labor": [
    {
      titleEn: "Open the labour establishment file",
      titleAr: "فتح ملف المنشأة العمالي",
      descriptionEn: "Establish the labour file used for employment contracts and workforce services.",
      descriptionAr: "أنشئ ملف العمل المستخدم لعقود التوظيف وخدمات القوى العاملة.",
    },
    {
      titleEn: "Review workforce and Saudization context",
      titleAr: "مراجعة سياق القوى العاملة والتوطين",
      descriptionEn: "Review the workforce classification context that applies to your establishment with the official authority.",
      descriptionAr: "راجع سياق تصنيف القوى العاملة المنطبق على منشأتك مع الجهة الرسمية.",
    },
  ],
  "pw-mudad-wps": [
    {
      titleEn: "Prepare payroll for wage protection",
      titleAr: "تهيئة الرواتب لحماية الأجور",
      descriptionEn: "Prepare payroll handling so salary payments can be reported as required.",
      descriptionAr: "هيّئ معالجة الرواتب ليتسنى الإبلاغ عن مدفوعات الرواتب حسب المطلوب.",
    },
  ],
  "pw-zatca-tax": [
    {
      titleEn: "Register with ZATCA",
      titleAr: "التسجيل لدى هيئة الزكاة والضريبة والجمارك",
      descriptionEn: "Complete the applicable ZATCA registration for your entity and activity.",
      descriptionAr: "أكمل التسجيل المنطبق لدى هيئة الزكاة والضريبة والجمارك لكيانك ونشاطك.",
    },
    {
      titleEn: "Review VAT applicability",
      titleAr: "مراجعة انطباق ضريبة القيمة المضافة",
      descriptionEn: "Review with the official authority whether VAT registration applies to your turnover and activity.",
      descriptionAr: "راجع مع الجهة الرسمية ما إذا كان تسجيل ضريبة القيمة المضافة ينطبق على إيراداتك ونشاطك.",
    },
    {
      titleEn: "Assess electronic-invoicing readiness",
      titleAr: "تقييم الجاهزية للفوترة الإلكترونية",
      descriptionEn: "Confirm which electronic-invoicing obligations apply to your registration and prepare accordingly.",
      descriptionAr: "أكّد التزامات الفوترة الإلكترونية المنطبقة على تسجيلك واستعد وفقًا لذلك.",
    },
  ],
  "pw-balady-food": [
    {
      titleEn: "Confirm premises and location suitability",
      titleAr: "تأكيد ملاءمة المقر والموقع",
      descriptionEn: "Confirm the premises meet the municipal requirements for your activity before applying.",
      descriptionAr: "تأكد من استيفاء المقر للمتطلبات البلدية لنشاطك قبل التقديم.",
    },
    {
      titleEn: "Apply for the municipal licence",
      titleAr: "التقديم على الرخصة البلدية",
      descriptionEn: "Apply for the municipal licence for the premises through the official municipal channel.",
      descriptionAr: "قدّم على الرخصة البلدية للمقر عبر القناة البلدية الرسمية.",
    },
  ],
  "pw-government-sales": [
    {
      titleEn: "Review government-procurement readiness",
      titleAr: "مراجعة الجاهزية للمشتريات الحكومية",
      descriptionEn: "Review the registration and eligibility context for selling to government entities with the official authority.",
      descriptionAr: "راجع سياق التسجيل والأهلية للبيع للجهات الحكومية مع الجهة الرسمية.",
    },
  ],
};

const ACTIVITIES: { slug: string; nameEn: string; nameAr: string; sectorSlug: string }[] = [
  { slug: "saas-platform", nameEn: "SaaS platform", nameAr: "منصة برمجيات كخدمة", sectorSlug: "technology-saas" },
  { slug: "it-services", nameEn: "IT services", nameAr: "خدمات تقنية المعلومات", sectorSlug: "technology-saas" },
  { slug: "management-consulting", nameEn: "Management consulting", nameAr: "الاستشارات الإدارية", sectorSlug: "consulting" },
  { slug: "wholesale-trading", nameEn: "Wholesale trading", nameAr: "تجارة الجملة", sectorSlug: "trading" },
  { slug: "online-retail", nameEn: "Online retail", nameAr: "التجزئة الإلكترونية", sectorSlug: "ecommerce" },
  { slug: "restaurant-catering", nameEn: "Restaurant / catering", nameAr: "مطعم / تموين", sectorSlug: "food-beverage" },
  { slug: "general-contracting", nameEn: "General contracting", nameAr: "المقاولات العامة", sectorSlug: "construction" },
  { slug: "staffing-services", nameEn: "Staffing services", nameAr: "خدمات التوظيف", sectorSlug: "recruitment-hr" },
  { slug: "training-provider", nameEn: "Training provider", nameAr: "مزود تدريب", sectorSlug: "education-training" },
  { slug: "medical-supplies", nameEn: "Medical supplies distribution", nameAr: "توزيع المستلزمات الطبية", sectorSlug: "healthcare-support" },
  { slug: "tour-operator", nameEn: "Tour operator", nameAr: "منظم رحلات", sectorSlug: "tourism-events" },
];

/** Seed ordered steps + sequential dependencies for the approved pathways. */
export async function seedPathwaySteps(prisma: PrismaClient): Promise<{ steps: number; dependencies: number }> {
  let steps = 0;
  let dependencies = 0;

  for (const [slug, seeds] of Object.entries(PATHWAY_STEPS)) {
    const pathway = await prisma.pathway.findUnique({
      where: { slug },
      select: { id: true, requiresProfessionalReview: true },
    });
    if (!pathway) continue;

    const stepIds: string[] = [];
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      const data = {
        titleEn: s.titleEn,
        titleAr: s.titleAr,
        descriptionEn: s.descriptionEn,
        descriptionAr: s.descriptionAr,
        requiresVerification: true,
        requiresProfessionalReview: pathway.requiresProfessionalReview,
      };
      const existing = await prisma.pathwayStep.findUnique({
        where: { pathwayId_order: { pathwayId: pathway.id, order: i } },
      });
      const step = existing
        ? await prisma.pathwayStep.update({ where: { id: existing.id }, data })
        : await prisma.pathwayStep.create({ data: { ...data, pathwayId: pathway.id, order: i } });
      stepIds.push(step.id);
      steps++;
    }

    for (let i = 1; i < stepIds.length; i++) {
      const existing = await prisma.pathwayStepDependency.findUnique({
        where: { stepId_dependsOnId: { stepId: stepIds[i], dependsOnId: stepIds[i - 1] } },
      });
      if (!existing) {
        await prisma.pathwayStepDependency.create({
          data: { stepId: stepIds[i], dependsOnId: stepIds[i - 1] },
        });
        dependencies++;
      }
    }
  }

  return { steps, dependencies };
}

/** Seed the activity taxonomy used for applicability. */
export async function seedActivities(prisma: PrismaClient): Promise<number> {
  const sectorBySlug = Object.fromEntries(
    (await prisma.sector.findMany({ select: { id: true, slug: true } })).map((s) => [s.slug, s.id])
  );
  for (const a of ACTIVITIES) {
    const payload = {
      slug: a.slug,
      nameEn: a.nameEn,
      nameAr: a.nameAr,
      sectorId: sectorBySlug[a.sectorSlug] ?? null,
    };
    await prisma.activity.upsert({ where: { slug: a.slug }, update: payload, create: payload });
  }
  return ACTIVITIES.length;
}
