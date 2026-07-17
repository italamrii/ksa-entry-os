import type { Locale } from "./index";

type Bilingual = { en: string; ar: string };

function b(locale: Locale, pair: Bilingual) {
  return locale === "ar" ? pair.ar : pair.en;
}

export const landingContent = {
  hero: {
    overline: { en: "Saudi Market Entry Intelligence", ar: "منصة ذكاء دخول السوق السعودي" },
    title: {
      en: "Turn Saudi market-entry uncertainty into a clear, official-link roadmap.",
      ar: "حوّل غموض دخول السوق السعودي إلى خارطة طريق واضحة بروابط رسمية.",
    },
    subtitle: {
      en: "KSA Entry OS helps companies map the official pathways, requirements, authorities, and next steps involved in entering the Saudi market — without collecting sensitive documents or replacing licensed advisors.",
      ar: "تساعد KSA Entry OS الشركات على رسم المسارات الرسمية والمتطلبات والجهات والخطوات التالية لدخول السوق السعودي — دون جمع مستندات حساسة أو استبدال المستشارين المرخصين.",
    },
    ctaPrimary: { en: "Build your entry roadmap", ar: "ابنِ خارطة طريق الدخول" },
    ctaSecondary: { en: "See how it works", ar: "استعرض كيف تعمل المنصة" },
    audience: {
      en: "For founders, CEOs, HR leaders, consultants, and international expansion teams preparing Saudi entry plans.",
      ar: "للمؤسسين والمديرين التنفيذيين وقادة الموارد البشرية والمستشارين وفرق التوسع الدولي.",
    },
  },
  trustStrip: [
    { en: "Investment pathway awareness", ar: "الوعي بمسارات الاستثمار" },
    { en: "Saudi Business Center setup flow", ar: "مسار إعداد مركز الأعمال السعودي" },
    { en: "ZATCA readiness signals", ar: "مؤشرات الجاهزية لدى هيئة الزكاة والضريبة" },
    { en: "Employer setup guidance", ar: "إرشادات إعداد صاحب العمل" },
    { en: "Sector licensing signals", ar: "مؤشرات الترخيص القطاعي" },
    { en: "Official-link based navigation", ar: "تنقل قائم على الروابط الرسمية" },
  ],
  problem: {
    title: {
      en: "Saudi market entry is not one form. It is a sequence of decisions across multiple official portals.",
      ar: "دخول السوق السعودي ليس نموذجًا واحدًا — بل سلسلة قرارات عبر بوابات وجهات رسمية متعددة.",
    },
    body: {
      en: "Each activity triggers different authorities, sequencing, and compliance awareness. Without structure, teams lose time, miss steps, and plan with incomplete information. KSA Entry OS organizes publicly available official guidance into a pathway your company can act on internally.",
      ar: "كل نشاط يستدعي جهات وتسلسلًا ووعيًا مختلفًا بالامتثال. دون هيكلة، تضيع الفرق الوقت وتفوّت خطوات. تنظم KSA Entry OS الإرشادات الرسمية المتاحة في مسار يمكن لفريقك العمل عليه داخليًا.",
    },
    points: [
      { en: "Fragmented official pathways", ar: "مسارات رسمية مجزأة" },
      { en: "Activity-specific requirements", ar: "متطلبات تختلف حسب النشاط" },
      { en: "Unclear sequence of next steps", ar: "تسلسل غير واضح للخطوات التالية" },
    ],
  },
  howItWorks: {
    title: { en: "Move from uncertainty to structured action", ar: "من الغموض إلى إجراء مهيكل" },
    subtitle: {
      en: "A four-step process to identify what applies before you start",
      ar: "عملية من أربع خطوات لتحديد ما ينطبق قبل أن تبدأ",
    },
    steps: [
      {
        step: "01",
        title: { en: "Profile the company", ar: "تحليل ملف الشركة" },
        desc: {
          en: "Capture sector, entry objective, hiring intent, and timeline. No sensitive documents required.",
          ar: "سجّل القطاع وهدف الدخول ونية التوظيف والجدول الزمني. دون مستندات حساسة.",
        },
      },
      {
        step: "02",
        title: { en: "Match the relevant pathways", ar: "مطابقة المسارات المناسبة" },
        desc: {
          en: "Identify which official routes and requirements likely apply to your activity profile.",
          ar: "حدد المسارات والمتطلبات الرسمية التي تنطبق على ملف نشاطك.",
        },
      },
      {
        step: "03",
        title: { en: "Map authorities and official links", ar: "ربط الجهات والروابط الرسمية" },
        desc: {
          en: "See responsible authorities, applicability, complexity, risk signals, and direct official sources.",
          ar: "اعرض الجهات المسؤولة وشروط الانطباق والتعقيد وإشارات المخاطر والمصادر الرسمية.",
        },
      },
      {
        step: "04",
        title: { en: "Export a structured report", ar: "تصدير تقرير مهيكل" },
        desc: {
          en: "Generate a board-ready PDF with roadmap, checklist, and official-link references for internal planning.",
          ar: "أنشئ تقرير PDF جاهزًا للإدارة يتضمن خارطة الطريق وقائمة التحقق والروابط الرسمية.",
        },
      },
    ],
  },
  provides: {
    title: { en: "What companies receive", ar: "ماذا تحصل الشركات" },
    subtitle: {
      en: "Deliverables designed for internal planning — not generic feature lists",
      ar: "مخرجات مصممة للتخطيط الداخلي — وليست قوائم ميزات عامة",
    },
    cards: [
      {
        title: { en: "Tailored entry roadmap", ar: "خارطة طريق دخول مخصصة" },
        desc: {
          en: "Sequential steps mapped to your company profile, activity, and expansion intent.",
          ar: "خطوات متسلسلة مرتبطة بملف شركتك ونشاطك ونية التوسع.",
        },
      },
      {
        title: { en: "Official authority map", ar: "خريطة الجهات الرسمية" },
        desc: {
          en: "See which authorities are relevant and why — with direct links to official portals.",
          ar: "اعرف الجهات ذات الصلة ولماذا — مع روابط مباشرة للبوابات الرسمية.",
        },
      },
      {
        title: { en: "Requirement-by-activity breakdown", ar: "تفصيل المتطلبات حسب النشاط" },
        desc: {
          en: "Understand what applies, when it applies, and what category each step falls under.",
          ar: "افهم ما ينطبق ومتى ينطبق وتحت أي فئة تقع كل خطوة.",
        },
      },
      {
        title: { en: "Board-ready PDF report", ar: "تقرير PDF جاهز للإدارة" },
        desc: {
          en: "Export a professional report for leadership reviews, advisor discussions, and internal alignment.",
          ar: "صدّر تقريرًا احترافيًا لمراجعات الإدارة ومناقشات المستشارين والتوافق الداخلي.",
        },
      },
      {
        title: { en: "Risk and complexity notes", ar: "ملاحظات المخاطر والتعقيد" },
        desc: {
          en: "Surface where licensed legal or tax advisors may be required before you commit resources.",
          ar: "أبرز الحالات التي قد تتطلب مستشارين قانونيين أو ضريبيين مرخصين قبل تخصيص الموارد.",
        },
      },
      {
        title: { en: "Next-step checklist", ar: "قائمة الخطوات التالية" },
        desc: {
          en: "A clear action sequence your team can use to prepare Saudi market entry planning.",
          ar: "تسلسل إجراءات واضح يستخدمه فريقك للتحضير لخطة دخول السوق السعودي.",
        },
      },
    ],
  },
  roadmapPreview: {
    title: { en: "Sample entry journey", ar: "نموذج رحلة دخول" },
    subtitle: {
      en: "Foreign SaaS Company → Saudi Market Entry",
      ar: "شركة SaaS أجنبية ← دخول السوق السعودي",
    },
    steps: [] as { en: string; ar: string }[],
  },
  whyUse: {
    title: { en: "Why expansion teams choose KSA Entry OS", ar: "لماذا تختار فرق التوسع KSA Entry OS" },
    cards: [
      {
        title: { en: "Identify what applies before you start", ar: "حدد ما ينطبق قبل أن تبدأ" },
        desc: {
          en: "Replace weeks of fragmented research with a structured first-pass roadmap.",
          ar: "استبدل أسابيع من البحث المجزأ بخارطة طريق أولية مهيكلة.",
        },
      },
      {
        title: { en: "Navigate official pathways with confidence", ar: "تنقّل بين المسارات الرسمية بثقة" },
        desc: {
          en: "Know which authorities matter, in what order, and where to verify on official portals.",
          ar: "اعرف الجهات المهمة وترتيبها وأين تتحقق عبر البوابات الرسمية.",
        },
      },
      {
        title: { en: "Prepare your Saudi market entry plan", ar: "جهّز خطة دخولكم للسوق السعودي" },
        desc: {
          en: "Give leadership, legal, HR, and finance a shared reference for expansion planning.",
          ar: "امنح الإدارة والقانونية والموارد البشرية والمالية مرجعًا مشتركًا للتخطيط.",
        },
      },
    ],
  },
  sectors: {
    title: { en: "Activity coverage across key sectors", ar: "تغطية الأنشطة عبر القطاعات الرئيسية" },
    subtitle: {
      en: "Pre-mapped licensing signals and pathway awareness for major industries",
      ar: "إشارات ترخيص ووعي بالمسارات مُعدّة مسبقًا للقطاعات الرئيسية",
    },
    list: [
      { en: "Technology / SaaS", ar: "التقنية / البرمجيات كخدمة" },
      { en: "Consulting", ar: "الاستشارات" },
      { en: "Trading", ar: "التجارة" },
      { en: "E-commerce", ar: "التجارة الإلكترونية" },
      { en: "Food & Beverage", ar: "الأغذية والمشروبات" },
      { en: "Construction", ar: "الإنشاءات والمقاولات" },
      { en: "Recruitment / HR", ar: "التوظيف والموارد البشرية" },
      { en: "Education / Training", ar: "التعليم والتدريب" },
      { en: "Healthcare support", ar: "دعم الرعاية الصحية" },
      { en: "Tourism / Events", ar: "السياحة والفعاليات" },
    ],
  },
  pricing: {
    title: { en: "Invest in clarity — not confusion", ar: "استثمر في الوضوح — لا في الغموض" },
    subtitle: {
      en: "Choose the level of structure your team needs for Saudi entry planning",
      ar: "اختر مستوى الهيكلة الذي يحتاجه فريقك لتخطيط الدخول للسعودية",
    },
    popular: { en: "Most selected", ar: "الأكثر اختيارًا" },
    free: { en: "Start free assessment", ar: "ابدأ التقييم المجاني" },
    choose: { en: "Generate professional report", ar: "أنشئ التقرير الاحترافي" },
    business: { en: "Prepare business entry plan", ar: "جهّز خطة دخول الأعمال" },
    plans: {
      FREE: {
        name: { en: "Free Assessment", ar: "التقييم المجاني" },
        tagline: { en: "Explore your likely Saudi entry path", ar: "استكشف مسار الدخول المحتمل" },
        desc: {
          en: "Understand whether KSA Entry OS fits your planning needs before committing.",
          ar: "تعرّف على مدى ملاءمة المنصة لاحتياجات التخطيط قبل الالتزام.",
        },
        features: {
          en: ["Basic company profile", "Limited roadmap preview", "General official pathway awareness"],
          ar: ["ملف شركة أساسي", "معاينة محدودة لخارطة الطريق", "وعي عام بالمسارات الرسمية"],
        },
      },
      PROFESSIONAL: {
        name: { en: "Professional Report", ar: "التقرير الاحترافي" },
        tagline: { en: "Generate a structured market-entry roadmap", ar: "أنشئ خارطة طريق مهيكلة لدخول السوق" },
        desc: {
          en: "Full activity-based roadmap with official links and exportable PDF for internal teams.",
          ar: "خارطة طريق كاملة حسب النشاط مع روابط رسمية وتقرير PDF للفرق الداخلية.",
        },
        features: {
          en: [
            "Full activity-based roadmap",
            "Official authority links",
            "Risk and complexity notes",
            "PDF report export",
            "Next-step checklist",
          ],
          ar: [
            "خارطة طريق كاملة حسب النشاط",
            "روابط الجهات الرسمية",
            "ملاحظات المخاطر والتعقيد",
            "تصدير تقرير PDF",
            "قائمة الخطوات التالية",
          ],
        },
      },
      BUSINESS: {
        name: { en: "Business Navigation", ar: "تنقل الأعمال" },
        tagline: { en: "Prepare a more complete internal entry plan", ar: "جهّز خطة دخول داخلية أكثر اكتمالًا" },
        desc: {
          en: "Enhanced planning support for complex entries and partner consultation requests.",
          ar: "دعم تخطيط معزز للحالات المعقدة وطلبات الاستشارة مع الشركاء.",
        },
        features: {
          en: [
            "Everything in Professional",
            "Priority roadmap request",
            "Enhanced sector notes",
            "Consultation request with licensed partners",
            "Internal planning summary",
          ],
          ar: [
            "كل مزايا التقرير الاحترافي",
            "طلب خارطة طريق بأولوية",
            "ملاحظات قطاعية معززة",
            "طلب استشارة مع شركاء مرخصين",
            "ملخص تخطيط داخلي",
          ],
        },
      },
    },
  },
  faq: {
    title: { en: "Questions expansion teams ask", ar: "أسئلة تطرحها فرق التوسع" },
    items: [
      {
        q: { en: "Does this replace legal or tax advisors?", ar: "هل يحل هذا محل المستشارين القانونيين أو الضريبيين؟" },
        a: {
          en: "No. KSA Entry OS is a navigation and structuring platform. It helps you understand likely pathways using public official sources. Licensed advisors should validate entity structure, tax position, and licensing decisions.",
          ar: "لا. KSA Entry OS منصة تنقل وهيكلة. تساعدك على فهم المسارات المحتملة من مصادر رسمية عامة. يجب على المستشارين المرخصين التحقق من هيكلة الكيان والوضع الضريبي وقرارات الترخيص.",
        },
      },
      {
        q: { en: "Will the platform submit applications for us?", ar: "هل تقدم المنصة الطلبات نيابة عنا؟" },
        a: {
          en: "No. We do not process registrations, licenses, or government submissions. We map requirements and link to official portals so your team knows where to verify and act.",
          ar: "لا. لا نعالج التسجيلات أو التراخيص أو الطلبات الحكومية. نربط المتطلبات بالبوابات الرسمية ليعرف فريقك أين يتحقق ويتصرف.",
        },
      },
      {
        q: { en: "What information do you need from us?", ar: "ما المعلومات التي تحتاجونها منا؟" },
        a: {
          en: "Company profile, sector, activity intent, and assessment answers. We do not collect IDs, passports, CR numbers, bank details, or document uploads.",
          ar: "ملف الشركة والقطاع ونية النشاط وإجابات التقييم. لا نجمع هويات أو جوازات أو أرقام سجلات أو بيانات بنكية أو مرفقات.",
        },
      },
      {
        q: { en: "Who is this built for?", ar: "لمن صُممت هذه المنصة؟" },
        a: {
          en: "Founders, CEOs, HR and compliance leaders, consultants, and international companies building a Saudi expansion plan for the first time or refining an existing one.",
          ar: "المؤسسون والمديرون التنفيذيون وقادة الموارد البشرية والامتثال والمستشارون والشركات الدولية التي تبني أو تحسّن خطة التوسع في السعودية.",
        },
      },
    ],
  },
  cta: {
    title: {
      en: "Prepare your Saudi market entry plan with structure and confidence",
      ar: "جهّز خطة دخولكم للسوق السعودي بثقة وهيكلة",
    },
    subtitle: {
      en: "Profile your company, map official pathways, and generate a roadmap your team can act on — without sensitive documents or government submissions.",
      ar: "حلّل ملف شركتك وارسم المسارات الرسمية وأنشئ خارطة طريق يعمل عليها فريقك — دون مستندات حساسة أو طلبات حكومية.",
    },
    button: { en: "Build your first roadmap", ar: "ابنِ أول خارطة طريق" },
  },
  preview: {
    roadmap: { en: "Entry roadmap", ar: "خارطة طريق الدخول" },
    report: { en: "Executive summary", ar: "ملخص تنفيذي" },
    compliance: { en: "Compliance signals", ar: "إشارات الامتثال" },
    steps: { en: "steps mapped", ar: "خطوة مُحددة" },
    risk: { en: "Risk", ar: "المخاطر" },
    medium: { en: "Medium", ar: "متوسط" },
    authority: { en: "Authority", ar: "الجهة" },
    misa: { en: "Ministry of Investment", ar: "وزارة الاستثمار" },
  },
};

export const dashboardContent = {
  overline: { en: "Entry command center", ar: "مركز قيادة الدخول" },
  welcome: { en: "Your Saudi entry command center", ar: "مركز قيادة دخولكم للسوق السعودي" },
  subtitle: {
    en: "Track your roadmap, entry reports, official-link references, and next actions in one place.",
    ar: "تتبع خارطة الطريق وتقارير الدخول والروابط الرسمية والإجراءات التالية في مكان واحد.",
  },
  newAssessment: { en: "Build new roadmap", ar: "إنشاء خارطة طريق جديدة" },
  latestAssessment: { en: "Latest roadmap", ar: "آخر خارطة طريق" },
  roadmapSteps: { en: "steps mapped", ar: "خطوة مُحددة" },
  viewRoadmap: { en: "Open roadmap", ar: "فتح خارطة الطريق" },
  noAssessment: { en: "No roadmap generated yet", ar: "لم تُنشأ خارطة طريق بعد" },
  startFirst: {
    en: "Start by profiling your company activity and we will map a structured Saudi market-entry path.",
    ar: "ابدأ بتحليل نشاط شركتك وسنرسم مسارًا مهيكلًا لدخول السوق السعودي.",
  },
  buildFirst: { en: "Build your first roadmap", ar: "ابنِ أول خارطة طريق" },
  activeReports: { en: "Active entry reports", ar: "تقارير الدخول النشطة" },
  viewReports: { en: "View entry reports", ar: "عرض تقارير الدخول" },
  paymentStatus: { en: "Payment status", ar: "حالة الدفع" },
  noPayments: { en: "No payments on record", ar: "لا توجد مدفوعات مسجلة" },
  downloadReport: { en: "Download board-ready report", ar: "تحميل التقرير الجاهز للإدارة" },
  download: { en: "Download report", ar: "تحميل التقرير" },
  quickActions: { en: "Quick actions", ar: "إجراءات سريعة" },
  recentActivity: { en: "Recent activity", ar: "النشاط الأخير" },
  keyNotices: { en: "Key notices", ar: "إشعارات مهمة" },
  noticeDisclaimer: {
    en: "General guidance only — verify all requirements with official authorities or licensed advisors before acting.",
    ar: "إرشادات عامة فقط — تحقق من جميع المتطلبات عبر الجهات الرسمية أو المستشارين المرخصين قبل التصرف.",
  },
  consultation: {
    en: "Request partner consultation",
    ar: "طلب استشارة مع شريك",
  },
  consultationNote: {
    en: "Subject to licensed partner availability. This platform does not provide legal or tax advice.",
    ar: "حسب توفر الشريك المرخص. لا تقدم المنصة استشارة قانونية أو ضريبية.",
  },
  progress: { en: "Readiness progress", ar: "تقدم الجاهزية" },
  reportReady: { en: "Board-ready report available", ar: "تقرير جاهز للإدارة متاح" },
  linkCoverage: { en: "Official-link coverage", ar: "تغطية الروابط الرسمية" },
  nextAction: { en: "Next recommended action", ar: "الإجراء التالي الموصى به" },
  nextActionDesc: {
    en: "Complete your company profile assessment to generate your tailored entry roadmap.",
    ar: "أكمل تقييم ملف الشركة لإنشاء خارطة طريق الدخول المخصصة.",
  },
};

export const requestsContent = {
  title: { en: "Entry Reports", ar: "تقارير الدخول" },
  subtitle: {
    en: "Your market entry plans, roadmap requests, and report status in one view",
    ar: "خطط دخول السوق وطلبات خارطة الطريق وحالة التقارير في عرض واحد",
  },
  emptyTitle: { en: "You have not created an entry roadmap yet", ar: "لم تنشئ خارطة طريق دخول بعد" },
  emptyBody: {
    en: "Start by profiling your company activity and we will generate a structured Saudi market-entry path.",
    ar: "ابدأ بتحليل نشاط شركتك وسنُنشئ مسارًا مهيكلًا لدخول السوق السعودي.",
  },
  emptyCta: { en: "Build your first roadmap", ar: "ابنِ أول خارطة طريق" },
  upgradeCta: { en: "Generate professional report", ar: "أنشئ التقرير الاحترافي" },
  openRoadmap: { en: "Open roadmap", ar: "فتح خارطة الطريق" },
  downloadReport: { en: "Download report", ar: "تحميل التقرير" },
  continueReview: { en: "Continue review", ar: "متابعة المراجعة" },
  company: { en: "Company", ar: "الشركة" },
  sector: { en: "Sector", ar: "القطاع" },
  objective: { en: "Entry objective", ar: "هدف الدخول" },
  lastUpdated: { en: "Last updated", ar: "آخر تحديث" },
  reportStatus: { en: "Report", ar: "التقرير" },
  payment: { en: "Payment", ar: "الدفع" },
  statusLabels: {
    PENDING: { en: "Payment pending", ar: "بانتظار الدفع" },
    IN_REVIEW: { en: "Needs review", ar: "يحتاج مراجعة" },
    COMPLETED: { en: "Report ready", ar: "التقرير جاهز" },
    CANCELLED: { en: "Archived", ar: "مؤرشف" },
    DRAFT: { en: "Draft", ar: "مسودة" },
    GENERATED: { en: "Roadmap generated", ar: "تم إنشاء خارطة الطريق" },
  },
};

export const assessmentContent = {
  newTitle: { en: "Company entry profiling", ar: "تحليل ملف دخول الشركة" },
  newSubtitle: {
    en: "Answer guided questions to map official pathways that apply to your Saudi expansion plan",
    ar: "أجب على أسئلة موجهة لربط المسارات الرسمية التي تنطبق على خطة توسعكم",
  },
  generate: { en: "Generate entry roadmap", ar: "إنشاء خارطة طريق الدخول" },
  generating: { en: "Mapping pathways…", ar: "جاري رسم المسارات…" },
  resultTitle: { en: "Your Saudi entry roadmap", ar: "خارطة طريق الدخول للسوق السعودي" },
  resultSubtitle: { en: "steps identified for your company profile", ar: "خطوة محددة لملف شركتك" },
  upgrade: { en: "Unlock full roadmap & PDF", ar: "فتح الخارطة الكاملة وتقرير PDF" },
  download: { en: "Download board-ready report", ar: "تحميل التقرير الجاهز للإدارة" },
  previewNote: {
    en: "Limited preview — upgrade to access the full roadmap, official links, and PDF export.",
    ar: "معاينة محدودة — قم بالترقية للوصول الكامل وروابط الجهات وتصدير PDF.",
  },
  lockedNote: {
    en: "additional steps available in the full report",
    ar: "خطوة إضافية متاحة في التقرير الكامل",
  },
  unlock: { en: "Unlock full entry report", ar: "فتح تقرير الدخول الكامل" },
};

export function getLanding(locale: Locale) {
  const content = landingContent;
  return {
    hero: {
      overline: b(locale, content.hero.overline),
      title: b(locale, content.hero.title),
      subtitle: b(locale, content.hero.subtitle),
      ctaPrimary: b(locale, content.hero.ctaPrimary),
      ctaSecondary: b(locale, content.hero.ctaSecondary),
      audience: b(locale, content.hero.audience),
    },
    trustStrip: content.trustStrip.map((item) => b(locale, item)),
    problem: {
      title: b(locale, content.problem.title),
      body: b(locale, content.problem.body),
      points: content.problem.points.map((p) => b(locale, p)),
    },
    howItWorks: {
      title: b(locale, content.howItWorks.title),
      subtitle: b(locale, content.howItWorks.subtitle),
      steps: content.howItWorks.steps.map((s) => ({
        step: s.step,
        title: b(locale, s.title),
        desc: b(locale, s.desc),
      })),
    },
    provides: {
      title: b(locale, content.provides.title),
      subtitle: b(locale, content.provides.subtitle),
      cards: content.provides.cards.map((c) => ({
        title: b(locale, c.title),
        desc: b(locale, c.desc),
      })),
    },
    roadmapPreview: {
      title: b(locale, content.roadmapPreview.title),
      subtitle: b(locale, content.roadmapPreview.subtitle),
    },
    whyUse: {
      title: b(locale, content.whyUse.title),
      cards: content.whyUse.cards.map((c) => ({
        title: b(locale, c.title),
        desc: b(locale, c.desc),
      })),
    },
    sectors: {
      title: b(locale, content.sectors.title),
      subtitle: b(locale, content.sectors.subtitle),
      list: content.sectors.list.map((s) => b(locale, s)),
    },
    pricing: {
      title: b(locale, content.pricing.title),
      subtitle: b(locale, content.pricing.subtitle),
      popular: b(locale, content.pricing.popular),
      free: b(locale, content.pricing.free),
      choose: b(locale, content.pricing.choose),
      business: b(locale, content.pricing.business),
    },
    faq: {
      title: b(locale, content.faq.title),
      items: content.faq.items.map((item) => ({
        q: b(locale, item.q),
        a: b(locale, item.a),
      })),
    },
    cta: {
      title: b(locale, content.cta.title),
      subtitle: b(locale, content.cta.subtitle),
      button: b(locale, content.cta.button),
    },
    preview: {
      roadmap: b(locale, content.preview.roadmap),
      report: b(locale, content.preview.report),
      compliance: b(locale, content.preview.compliance),
      steps: b(locale, content.preview.steps),
      risk: b(locale, content.preview.risk),
      medium: b(locale, content.preview.medium),
      authority: b(locale, content.preview.authority),
      misa: b(locale, content.preview.misa),
    },
  };
}

export function getDashboard(locale: Locale) {
  const c = dashboardContent;
  return Object.fromEntries(
    Object.entries(c).map(([key, val]) => {
      if (typeof val === "object" && "en" in val && "ar" in val) {
        return [key, b(locale, val as Bilingual)];
      }
      return [key, val];
    })
  ) as Record<keyof typeof dashboardContent, string>;
}

export function getRequests(locale: Locale) {
  const c = requestsContent;
  const statusLabels = Object.fromEntries(
    Object.entries(c.statusLabels).map(([k, v]) => [k, b(locale, v)])
  );
  return {
    ...Object.fromEntries(
      Object.entries(c)
        .filter(([k]) => k !== "statusLabels")
        .map(([key, val]) => {
          if (typeof val === "object" && "en" in val && "ar" in val) {
            return [key, b(locale, val as Bilingual)];
          }
          return [key, val];
        })
    ),
    statusLabels,
  } as Record<string, string> & { statusLabels: Record<string, string> };
}

export function getAssessment(locale: Locale) {
  const c = assessmentContent;
  return Object.fromEntries(
    Object.entries(c).map(([key, val]) => [key, b(locale, val as Bilingual)])
  ) as Record<keyof typeof assessmentContent, string>;
}

export const authContent = {
  loginTitle: { en: "Log in to", ar: "تسجيل الدخول إلى" },
  loginSubtitle: { en: "Enter your credentials to open your decision workspace", ar: "أدخل بياناتك لفتح مساحة قراراتك" },
  email: { en: "Email", ar: "البريد الإلكتروني" },
  password: { en: "Password", ar: "كلمة المرور" },
  signIn: { en: "Sign in", ar: "تسجيل الدخول" },
  signingIn: { en: "Signing in...", ar: "جارٍ تسجيل الدخول..." },
  noAccount: { en: "Don't have an account?", ar: "ليس لديك حساب؟" },
  registerLink: { en: "Register", ar: "إنشاء حساب" },
  welcomeBack: { en: "Welcome back!", ar: "مرحبًا بعودتك!" },
  loginFailed: { en: "Login failed", ar: "فشل تسجيل الدخول" },
  somethingWrong: { en: "Something went wrong", ar: "حدث خطأ ما" },
  registerTitle: { en: "Create your", ar: "أنشئ حسابك في" },
  registerTitleSuffix: { en: "account", ar: "" },
  registerSubtitle: { en: "Minimal information only — no sensitive documents required", ar: "معلومات أساسية فقط — لا حاجة لمستندات حساسة" },
  fullName: { en: "Full name", ar: "الاسم الكامل" },
  companyName: { en: "Company name", ar: "اسم الشركة" },
  country: { en: "Country", ar: "الدولة" },
  sector: { en: "Sector", ar: "القطاع" },
  selectSector: { en: "Select sector", ar: "اختر القطاع" },
  companyType: { en: "Company type", ar: "نوع الشركة" },
  selectType: { en: "Select type", ar: "اختر النوع" },
  entryGoal: { en: "Goal for entering Saudi Arabia", ar: "هدف دخول السوق السعودي" },
  selectGoal: { en: "Select goal", ar: "اختر الهدف" },
  createAccount: { en: "Create account", ar: "إنشاء الحساب" },
  creatingAccount: { en: "Creating account...", ar: "جارٍ إنشاء الحساب..." },
  accountCreated: { en: "Account created!", ar: "تم إنشاء الحساب!" },
  registrationFailed: { en: "Registration failed", ar: "فشل إنشاء الحساب" },
  haveAccount: { en: "Already have an account?", ar: "لديك حساب بالفعل؟" },
  loginLink: { en: "Log in", ar: "تسجيل الدخول" },
};

export function getAuth(locale: Locale) {
  return Object.fromEntries(
    Object.entries(authContent).map(([key, val]) => [key, b(locale, val as Bilingual)])
  ) as Record<keyof typeof authContent, string>;
}

/**
 * Client-side zod validation emits English messages (they double as API error
 * bodies). Translate the known ones for display; fall back to the original so a
 * new message is never silently hidden.
 */
const validationMessagesAr: Record<string, string> = {
  "Name must be at least 2 characters": "يجب ألا يقل الاسم عن حرفين",
  "Invalid email address": "بريد إلكتروني غير صالح",
  "Invalid email": "بريد إلكتروني غير صالح",
  "Password must be at least 8 characters": "يجب ألا تقل كلمة المرور عن 8 أحرف",
  "Must contain an uppercase letter": "يجب أن تحتوي على حرف كبير",
  "Must contain a lowercase letter": "يجب أن تحتوي على حرف صغير",
  "Must contain a number": "يجب أن تحتوي على رقم",
  "Company type is required": "نوع الشركة مطلوب",
  "Entry goal is required": "هدف الدخول مطلوب",
  "String must contain at least 2 character(s)": "يجب ألا يقل عن حرفين",
  "String must contain at least 1 character(s)": "هذا الحقل مطلوب",
};

export function translateValidation(message: string | undefined, locale: Locale): string | undefined {
  if (!message) return message;
  if (locale !== "ar") return message;
  return validationMessagesAr[message] ?? message;
}
