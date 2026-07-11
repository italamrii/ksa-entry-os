import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@ksaentryos.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!Secure";

  const sectors = [
    { slug: "technology-saas", nameEn: "Technology / SaaS", nameAr: "التقنية / SaaS" },
    { slug: "consulting", nameEn: "Consulting", nameAr: "الاستشارات" },
    { slug: "trading", nameEn: "Trading", nameAr: "التجارة" },
    { slug: "ecommerce", nameEn: "E-commerce", nameAr: "التجارة الإلكترونية" },
    { slug: "food-beverage", nameEn: "Food & Beverage", nameAr: "الأغذية والمشروبات" },
    { slug: "construction", nameEn: "Construction", nameAr: "الإنشاءات" },
    { slug: "recruitment-hr", nameEn: "Recruitment / HR", nameAr: "التوظيف / الموارد البشرية" },
    { slug: "education-training", nameEn: "Education / Training", nameAr: "التعليم / التدريب" },
    { slug: "healthcare-support", nameEn: "Healthcare Support", nameAr: "دعم الرعاية الصحية" },
    { slug: "tourism-events", nameEn: "Tourism / Events", nameAr: "السياحة / الفعاليات" },
  ];

  for (const s of sectors) {
    await prisma.sector.upsert({
      where: { slug: s.slug },
      update: s,
      create: s,
    });
  }

  const authorities = [
    { slug: "misa", nameEn: "Ministry of Investment (MISA)", nameAr: "وزارة الاستثمار", website: "https://misa.gov.sa" },
    { slug: "sbc", nameEn: "Saudi Business Center", nameAr: "مركز الأعمال السعودي", website: "https://business.sa" },
    { slug: "moc", nameEn: "Ministry of Commerce", nameAr: "وزارة التجارة", website: "https://mc.gov.sa" },
    { slug: "zatca", nameEn: "ZATCA", nameAr: "هيئة الزكاة والضريبة والجمارك", website: "https://zatca.gov.sa" },
    { slug: "gosi", nameEn: "GOSI", nameAr: "التأمينات الاجتماعية", website: "https://gosi.gov.sa" },
    { slug: "qiwa", nameEn: "Qiwa", nameAr: "قوى", website: "https://qiwa.sa" },
    { slug: "mudad", nameEn: "Mudad", nameAr: "مدد", website: "https://mudad.com.sa" },
    { slug: "balady", nameEn: "Balady", nameAr: "بلدي", website: "https://balady.gov.sa" },
    { slug: "sama", nameEn: "Saudi Central Bank (SAMA)", nameAr: "البنك المركزي السعودي", website: "https://sama.gov.sa" },
    { slug: "mot", nameEn: "Ministry of Tourism", nameAr: "وزارة السياحة", website: "https://mt.gov.sa" },
    { slug: "sfda", nameEn: "SFDA", nameAr: "هيئة الغذاء والدواء", website: "https://sfda.gov.sa" },
  ];

  for (const a of authorities) {
    await prisma.authority.upsert({
      where: { slug: a.slug },
      update: a,
      create: a,
    });
  }

  const authMap = Object.fromEntries(
    (await prisma.authority.findMany()).map((a) => [a.slug, a.id])
  );

  const officialLinks = [
    { authoritySlug: "misa", titleEn: "MISA Investor Portal", titleAr: "بوابة المستثمر - وزارة الاستثمار", url: "https://misa.gov.sa" },
    { authoritySlug: "sbc", titleEn: "Saudi Business Center Portal", titleAr: "بوابة مركز الأعمال السعودي", url: "https://business.sa" },
    { authoritySlug: "moc", titleEn: "Ministry of Commerce Services", titleAr: "خدمات وزارة التجارة", url: "https://mc.gov.sa" },
    { authoritySlug: "zatca", titleEn: "ZATCA Tax Portal", titleAr: "بوابة الزكاة والضريبة", url: "https://zatca.gov.sa" },
    { authoritySlug: "gosi", titleEn: "GOSI Employer Services", titleAr: "خدمات التأمينات للمنشآت", url: "https://gosi.gov.sa" },
    { authoritySlug: "qiwa", titleEn: "Qiwa Platform", titleAr: "منصة قوى", url: "https://qiwa.sa" },
    { authoritySlug: "mudad", titleEn: "Mudad Wage Protection", titleAr: "نظام حماية الأجور - مدد", url: "https://mudad.com.sa" },
    { authoritySlug: "balady", titleEn: "Balady Municipal Services", titleAr: "خدمات بلدي البلدية", url: "https://balady.gov.sa" },
  ];

  for (const link of officialLinks) {
    const existing = await prisma.officialLink.findFirst({ where: { url: link.url } });
    if (!existing) {
      await prisma.officialLink.create({
        data: {
          authorityId: authMap[link.authoritySlug],
          titleEn: link.titleEn,
          titleAr: link.titleAr,
          url: link.url,
        },
      });
    }
  }

  const requirements = [
    {
      slug: "market-entry-overview",
      ruleKey: "always",
      titleEn: "Understand Saudi Market Entry Framework",
      titleAr: "فهم إطار دخول السوق السعودي",
      descriptionEn: "Review the general framework for establishing business activities in Saudi Arabia. This step helps you understand which authorities may apply to your situation before taking formal action.",
      descriptionAr: "راجع الإطار العام لإنشاء الأنشطة التجارية في المملكة العربية السعودية. يساعدك هذا على فهم الجهات التي قد تنطبق على حالتك قبل اتخاذ إجراءات رسمية.",
      authoritySlug: "sbc",
      officialUrl: "https://business.sa",
      appliesWhenEn: "All companies exploring Saudi market entry",
      appliesWhenAr: "جميع الشركات التي تستكشف دخول السوق السعودي",
      complexity: "LOW" as const,
      riskLevel: "LOW" as const,
      categoryEn: "Planning",
      categoryAr: "التخطيط",
      order: 1,
    },
    {
      slug: "misa-foreign-investment",
      ruleKey: "misa_investment",
      titleEn: "Ministry of Investment (MISA) Path",
      titleAr: "مسار وزارة الاستثمار",
      descriptionEn: "Foreign investors typically begin with the Ministry of Investment to understand licensing requirements for foreign-owned entities. Requirements vary by activity and ownership structure.",
      descriptionAr: "عادةً ما يبدأ المستثمرون الأجانب مع وزارة الاستثمار لفهم متطلبات الترخيص للكيانات ذات الملكية الأجنبية. تختلف المتطلبات حسب النشاط وهيكل الملكية.",
      authoritySlug: "misa",
      officialUrl: "https://misa.gov.sa",
      appliesWhenEn: "Foreign companies entering Saudi Arabia",
      appliesWhenAr: "الشركات الأجنبية الداخلة إلى السعودية",
      complexity: "HIGH" as const,
      riskLevel: "MEDIUM" as const,
      categoryEn: "Investment Licensing",
      categoryAr: "ترخيص الاستثمار",
      disclaimerEn: "Licensed legal counsel may be required for entity structuring decisions.",
      disclaimerAr: "قد يلزم استشارة قانونية مرخصة لقرارات هيكلة الكيان.",
      order: 2,
    },
    {
      slug: "sbc-business-setup",
      ruleKey: "sbc_setup",
      titleEn: "Saudi Business Center Setup",
      titleAr: "إعداد مركز الأعمال السعودي",
      descriptionEn: "The Saudi Business Center provides a unified portal for business setup services. Use it to understand registration pathways and required steps for your activity.",
      descriptionAr: "يوفر مركز الأعمال السعودي بوابة موحدة لخدمات إعداد الأعمال. استخدمه لفهم مسارات التسجيل والخطوات المطلوبة لنشاطك.",
      authoritySlug: "sbc",
      officialUrl: "https://business.sa",
      appliesWhenEn: "Companies establishing or expanding in KSA",
      appliesWhenAr: "الشركات التي تؤسس أو تتوسع في السعودية",
      complexity: "MEDIUM" as const,
      riskLevel: "LOW" as const,
      categoryEn: "Business Setup",
      categoryAr: "إعداد الأعمال",
      order: 3,
    },
    {
      slug: "commercial-registration",
      ruleKey: "commercial_registration",
      titleEn: "Commercial Registration Awareness",
      titleAr: "الوعي بالسجل التجاري",
      descriptionEn: "Commercial registration is typically required for entities conducting business in Saudi Arabia. Requirements depend on entity type and activity.",
      descriptionAr: "عادةً ما يلزم السجل التجاري للكيانات التي تمارس الأعمال في السعودية. تعتمد المتطلبات على نوع الكيان والنشاط.",
      authoritySlug: "moc",
      officialUrl: "https://mc.gov.sa",
      appliesWhenEn: "Companies needing a local business presence",
      appliesWhenAr: "الشركات التي تحتاج حضورًا تجاريًا محليًا",
      complexity: "MEDIUM" as const,
      riskLevel: "MEDIUM" as const,
      categoryEn: "Registration",
      categoryAr: "التسجيل",
      order: 4,
    },
    {
      slug: "gosi-employer",
      ruleKey: "gosi_registration",
      titleEn: "GOSI Employer Registration",
      titleAr: "تسجيل المنشأة في التأمينات",
      descriptionEn: "If you plan to hire employees in Saudi Arabia, GOSI registration is typically required for social insurance compliance.",
      descriptionAr: "إذا كنت تخطط لتوظيف موظفين في السعودية، فعادةً ما يلزم التسجيل في التأمينات الاجتماعية.",
      authoritySlug: "gosi",
      officialUrl: "https://gosi.gov.sa",
      appliesWhenEn: "Companies hiring employees in KSA",
      appliesWhenAr: "الشركات التي توظف موظفين في السعودية",
      complexity: "MEDIUM" as const,
      riskLevel: "MEDIUM" as const,
      categoryEn: "HR & Payroll",
      categoryAr: "الموارد البشرية",
      order: 5,
    },
    {
      slug: "qiwa-labor",
      ruleKey: "qiwa_registration",
      titleEn: "Qiwa Labor Platform",
      titleAr: "منصة قوى للعمالة",
      descriptionEn: "Qiwa is the Ministry of Human Resources platform for labor-related services including contracts, visas, and workforce management.",
      descriptionAr: "قوى هي منصة وزارة الموارد البشرية للخدمات المتعلقة بالعمالة بما في ذلك العقود والتأشيرات.",
      authoritySlug: "qiwa",
      officialUrl: "https://qiwa.sa",
      appliesWhenEn: "Companies hiring employees in KSA",
      appliesWhenAr: "الشركات التي توظف موظفين في السعودية",
      complexity: "MEDIUM" as const,
      riskLevel: "MEDIUM" as const,
      categoryEn: "HR & Payroll",
      categoryAr: "الموارد البشرية",
      order: 6,
    },
    {
      slug: "mudad-wps",
      ruleKey: "mudad_registration",
      titleEn: "Mudad Wage Protection System",
      titleAr: "نظام حماية الأجور - مدد",
      descriptionEn: "Employers in Saudi Arabia must comply with wage protection requirements. Mudad facilitates salary payment compliance.",
      descriptionAr: "يجب على أصحاب العمل في السعودية الامتثال لد متطلبات حماية الأجور. يسهل مدد الامتثال لدفع الرواتب.",
      authoritySlug: "mudad",
      officialUrl: "https://mudad.com.sa",
      appliesWhenEn: "Companies with employees in KSA",
      appliesWhenAr: "الشركات التي لديها موظفون في السعودية",
      complexity: "LOW" as const,
      riskLevel: "MEDIUM" as const,
      categoryEn: "HR & Payroll",
      categoryAr: "الموارد البشرية",
      order: 7,
    },
    {
      slug: "zatca-tax",
      ruleKey: "zatca_vat",
      titleEn: "ZATCA Tax Registration Awareness",
      titleAr: "الوعي بتسجيل الزكاة والضريبة",
      descriptionEn: "If you invoice Saudi customers, you may need to register with ZATCA for tax compliance. Thresholds and requirements should be verified with official sources.",
      descriptionAr: "إذا كنت تصدر فواتير لعملاء سعوديين، قد تحتاج للتسجيل لدى هيئة الزكاة والضريبة. يجب التحقق من العتبات والمتطلبات عبر المصادر الرسمية.",
      authoritySlug: "zatca",
      officialUrl: "https://zatca.gov.sa",
      appliesWhenEn: "Companies invoicing Saudi customers",
      appliesWhenAr: "الشركات التي تصدر فواتير لعملاء سعوديين",
      complexity: "MEDIUM" as const,
      riskLevel: "HIGH" as const,
      categoryEn: "Tax",
      categoryAr: "الضريبة",
      disclaimerEn: "Licensed tax advisor consultation recommended for tax registration decisions.",
      disclaimerAr: "يُنصح باستشارة مستشار ضريبي مرخص لقرارات التسجيل الضريبي.",
      order: 8,
    },
    {
      slug: "government-sales",
      ruleKey: "government_sales",
      titleEn: "Government Sales Readiness",
      titleAr: "الجاهزية للبيع للجهات الحكومية",
      descriptionEn: "Selling to Saudi government entities may require additional registrations, local presence, and sector-specific qualifications. RHQ and localization policies may apply.",
      descriptionAr: "قد يتطلب البيع للجهات الحكومية السعودية تسجيلات إضافية وحضورًا محليًا ومؤهلات قطاعية. قد تنطبق سياسات المقرات الإقليمية والتوطين.",
      authoritySlug: "misa",
      officialUrl: "https://misa.gov.sa",
      appliesWhenEn: "Companies planning government sales",
      appliesWhenAr: "الشركات التي تخطط للبيع للجهات الحكومية",
      complexity: "HIGH" as const,
      riskLevel: "HIGH" as const,
      categoryEn: "Government",
      categoryAr: "الحكومة",
      disclaimerEn: "Government procurement requirements change frequently. Verify with official sources and licensed advisors.",
      disclaimerAr: "تتغير متطلبات المشتريات الحكومية باستمرار. تحقق من المصادر الرسمية والمستشارين المرخصين.",
      order: 9,
    },
    {
      slug: "balady-food",
      ruleKey: "sector_food",
      titleEn: "Balady Municipal Licensing (Food & Beverage)",
      titleAr: "ترخيص بلدي (الأغذية والمشروبات)",
      descriptionEn: "Food and beverage businesses typically require municipal licensing through Balady and may need additional health and safety approvals.",
      descriptionAr: "عادةً ما تتطلب أعمال الأغذية والمشروبات ترخيصًا بلديًا عبر بلدي وقد تحتاج موافقات صحية إضافية.",
      authoritySlug: "balady",
      officialUrl: "https://balady.gov.sa",
      appliesWhenEn: "Food & beverage sector companies",
      appliesWhenAr: "شركات قطاع الأغذية والمشروبات",
      complexity: "HIGH" as const,
      riskLevel: "HIGH" as const,
      categoryEn: "Sector Licensing",
      categoryAr: "ترخيص قطاعي",
      disclaimerEn: "Sector-specific licensing may require licensed consultants.",
      disclaimerAr: "قد يتطلب الترخيص القطاعي مستشارين مرخصين.",
      order: 10,
    },
    {
      slug: "fintech-licensing",
      ruleKey: "sector_fintech",
      titleEn: "Financial / Fintech Sector Licensing Warning",
      titleAr: "تحذير ترخيص قطاع التقنية المالية",
      descriptionEn: "Financial technology and regulated financial activities require specific licensing from SAMA and/or CMA. This is a high-risk, highly regulated sector.",
      descriptionAr: "تتطلب أنشطة التقنية المالية والأنشطة المالية المنظمة تراخيص محددة من SAMA و/أو CMA. هذا قطاع عالي المخاطر ومنظم بشدة.",
      authoritySlug: "sama",
      officialUrl: "https://sama.gov.sa",
      appliesWhenEn: "Fintech / regulated financial activities",
      appliesWhenAr: "التقنية المالية / الأنشطة المالية المنظمة",
      complexity: "HIGH" as const,
      riskLevel: "HIGH" as const,
      categoryEn: "Sector Licensing",
      categoryAr: "ترخيص قطاعي",
      disclaimerEn: "Licensed legal and regulatory advisors are strongly recommended.",
      disclaimerAr: "يُنصح بشدة بالمستشارين القانونيين والتنظيميين المرخصين.",
      order: 11,
    },
    {
      slug: "sfda-healthcare",
      ruleKey: "sector_healthcare",
      titleEn: "Healthcare Support Licensing Awareness",
      titleAr: "الوعي بترخيص دعم الرعاية الصحية",
      descriptionEn: "Healthcare-related activities may require SFDA or MOH approvals depending on the specific services offered.",
      descriptionAr: "قد تتطلب الأنشطة المتعلقة بالرعاية الصحية موافقات من هيئة الغذاء والدواء أو وزارة الصحة.",
      authoritySlug: "sfda",
      officialUrl: "https://sfda.gov.sa",
      appliesWhenEn: "Healthcare support sector",
      appliesWhenAr: "قطاع دعم الرعاية الصحية",
      complexity: "HIGH" as const,
      riskLevel: "HIGH" as const,
      categoryEn: "Sector Licensing",
      categoryAr: "ترخيص قطاعي",
      order: 12,
    },
    {
      slug: "tourism-licensing",
      ruleKey: "sector_tourism",
      titleEn: "Tourism & Events Licensing",
      titleAr: "ترخيص السياحة والفعاليات",
      descriptionEn: "Tourism and events businesses may require licensing from the Ministry of Tourism and related authorities.",
      descriptionAr: "قد تتطلب أعمال السياحة والفعاليات ترخيصًا من وزارة السياحة والجهات ذات الصلة.",
      authoritySlug: "mot",
      officialUrl: "https://mt.gov.sa",
      appliesWhenEn: "Tourism and events sector",
      appliesWhenAr: "قطاع السياحة والفعاليات",
      complexity: "MEDIUM" as const,
      riskLevel: "MEDIUM" as const,
      categoryEn: "Sector Licensing",
      categoryAr: "ترخيص قطاعي",
      order: 13,
    },
    {
      slug: "fast-timeline-planning",
      ruleKey: "fast_timeline",
      titleEn: "Accelerated Timeline Planning",
      titleAr: "تخطيط الجدول الزمني المعجل",
      descriptionEn: "A 1–3 month launch timeline requires early coordination across multiple authorities. Consider engaging licensed advisors to avoid delays.",
      descriptionAr: "يتطلب جدول إطلاق 1-3 أشهر تنسيقًا مبكرًا مع جهات متعددة. فكر في الاستعانة بمستشارين مرخصين لتجنب التأخير.",
      authoritySlug: "sbc",
      officialUrl: "https://business.sa",
      appliesWhenEn: "Target launch within 1–3 months",
      appliesWhenAr: "الإطلاق المستهدف خلال 1-3 أشهر",
      complexity: "HIGH" as const,
      riskLevel: "MEDIUM" as const,
      categoryEn: "Planning",
      categoryAr: "الت planning",
      order: 14,
    },
  ];

  for (const req of requirements) {
    const { authoritySlug, ...data } = req;
    await prisma.requirement.upsert({
      where: { slug: req.slug },
      update: {
        ...data,
        authorityId: authMap[authoritySlug],
      },
      create: {
        ...data,
        authorityId: authMap[authoritySlug],
      },
    });
  }

  const passwordHash = await hashPassword(adminPassword);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: "ADMIN" },
    create: {
      name: "Admin",
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
      companyName: "KSA Entry OS",
      country: "Saudi Arabia",
      companyType: "local",
      entryGoal: "explore",
      onboardingDone: true,
    },
  });

  console.log("Seed completed successfully");
  console.log(`Admin: ${adminEmail}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
