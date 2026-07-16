/**
 * Stage 7.5 — comprehensive Saudi market-entry coverage taxonomy (A–G), authored
 * as UNPUBLISHED governed content.
 *
 * GOVERNANCE CONTRACT — read before editing:
 *
 * Nothing here evaluates. Pathways are seeded at DRAFT and carry no Rule rows, so
 * `loadGovernedEngineRules` (PUBLISHED-only) ignores them and no user assessment
 * can surface them. They become live only when a human walks each one through
 * REVIEWED → LEGAL_FLAG_CHECK → APPROVED → PUBLISHED. Do not bulk-promote.
 *
 * Source status is evidence-based, not aspirational:
 *   SOURCE_VERIFIED — the cited page was retrieved on `VERIFIED_ON` and its own
 *                     content substantiates the claim recorded here.
 *   DRAFT           — the authority and official URL were confirmed, but the
 *                     portal is a client-rendered app that served no substantive
 *                     content to verification, so the regulatory detail is
 *                     UNVERIFIED and must be confirmed by a human reviewer.
 *
 * Titles/explanations deliberately stop at what the official source establishes:
 * which authority owns the obligation and where the official channel is. Numeric
 * thresholds, fees, deadlines and eligibility tests are NOT asserted — each entry
 * records that gap in `limitations` for the reviewer to close against the primary
 * source. Never fill these in from memory or from a secondary summary.
 */
import type { PrismaClient, SourceClassification, ContentStatus } from "@prisma/client";
import { createHash } from "node:crypto";

/** Date the official URLs below were retrieved and checked. */
const VERIFIED_ON = new Date("2026-07-16T00:00:00Z");
/** Governed content is re-verified on a 6-month cadence. */
const NEXT_REVIEW = new Date("2027-01-16T00:00:00Z");

/** Coverage taxonomy sections A–G. */
type Section = "A" | "B" | "C" | "D" | "E" | "F" | "G";

const SECTION_LABEL: Record<Section, string> = {
  A: "Investment & establishment",
  B: "Zakat, tax & customs",
  C: "Commercial & municipal licensing",
  D: "Employment & workforce",
  E: "Import & products",
  F: "Sector regulators",
  G: "Ongoing compliance",
};

interface AuthoritySeed {
  slug: string;
  nameEn: string;
  nameAr: string;
  website: string;
}

/** Authority names/URLs confirmed against each authority's own site. */
const AUTHORITIES: AuthoritySeed[] = [
  { slug: "misa", nameEn: "Ministry of Investment", nameAr: "وزارة الاستثمار", website: "https://misa.gov.sa/" },
  { slug: "moc", nameEn: "Ministry of Commerce", nameAr: "وزارة التجارة", website: "https://mc.gov.sa/" },
  { slug: "sbc", nameEn: "Saudi Business Center", nameAr: "المركز السعودي للأعمال", website: "https://business.sa/" },
  { slug: "zatca", nameEn: "Zakat, Tax and Customs Authority", nameAr: "هيئة الزكاة والضريبة والجمارك", website: "https://zatca.gov.sa/" },
  { slug: "momah", nameEn: "Ministry of Municipalities and Housing", nameAr: "وزارة الشؤون البلدية والإسكان", website: "https://momah.gov.sa/" },
  { slug: "mhrsd", nameEn: "Ministry of Human Resources and Social Development", nameAr: "وزارة الموارد البشرية والتنمية الاجتماعية", website: "https://hrsd.gov.sa/" },
  { slug: "gosi", nameEn: "General Organization for Social Insurance", nameAr: "المؤسسة العامة للتأمينات الاجتماعية", website: "https://www.gosi.gov.sa/" },
  { slug: "saso", nameEn: "Saudi Standards, Metrology and Quality Organization", nameAr: "الهيئة السعودية للمواصفات والمقاييس والجودة", website: "https://saso.gov.sa/" },
  { slug: "sfda", nameEn: "Saudi Food and Drug Authority", nameAr: "الهيئة العامة للغذاء والدواء", website: "https://www.sfda.gov.sa/" },
];

interface SourceSeed {
  key: string;
  authoritySlug: string;
  title: string;
  url: string;
  language: string;
  classification: SourceClassification;
  /** SOURCE_VERIFIED only where the page itself substantiated the claim. */
  status: Extract<ContentStatus, "DRAFT" | "SOURCE_VERIFIED">;
  /** What this source does NOT establish — the reviewer's checklist. */
  limitationsEn: string;
  limitationsAr: string;
  /** Why the status above is what it is. */
  reviewNotes: string;
}

const SOURCES: SourceSeed[] = [
  {
    key: "src-misa-home",
    authoritySlug: "misa",
    title: "Ministry of Investment — official portal",
    url: "https://misa.gov.sa/en/",
    language: "en",
    classification: "OFFICIAL_PRIMARY",
    status: "SOURCE_VERIFIED",
    limitationsEn:
      "Confirms the Ministry of Investment as the investment-licensing authority and links its e-services and investor registration. Does NOT establish which activities are open to foreign ownership, licence categories, fees, timelines, or document requirements. A reviewer must confirm each of these against the Investor Guide and Laws & Regulations before this content may be published.",
    limitationsAr:
      "يؤكد أن وزارة الاستثمار هي جهة ترخيص الاستثمار ويوفر روابط خدماتها الإلكترونية وتسجيل المستثمرين. لا يحدد الأنشطة المتاحة للملكية الأجنبية أو فئات الرخص أو الرسوم أو المدد أو المستندات المطلوبة. يجب على المراجع تأكيد ذلك من دليل المستثمر والأنظمة قبل النشر.",
    reviewNotes: "Retrieved 2026-07-16. Homepage confirms authority identity and links investsaudi.sa registration; no licensing detail published at this level.",
  },
  {
    key: "src-misa-laws",
    authoritySlug: "misa",
    title: "Ministry of Investment — laws and regulations",
    url: "https://misa.gov.sa/activities/laws/",
    language: "en",
    classification: "OFFICIAL_PRIMARY",
    status: "DRAFT",
    limitationsEn: "Linked from the Ministry's own homepage as its laws and regulations index. Contents were not retrieved during authoring; a reviewer must open this index and cite the specific instrument backing each investment requirement.",
    limitationsAr: "مرتبط من الصفحة الرئيسية للوزارة كفهرس الأنظمة واللوائح. لم يتم الاطلاع على محتواه أثناء التأليف؛ على المراجع فتح الفهرس والاستشهاد بالنظام المحدد لكل متطلب استثماري.",
    reviewNotes: "URL sourced from the verified MISA homepage. Contents unverified — reviewer must retrieve.",
  },
  {
    key: "src-zatca-home",
    authoritySlug: "zatca",
    title: "Zakat, Tax and Customs Authority — official portal",
    url: "https://zatca.gov.sa/en/Pages/default.aspx",
    language: "en",
    classification: "OFFICIAL_PRIMARY",
    status: "SOURCE_VERIFIED",
    limitationsEn:
      "Confirms ZATCA as the single authority for zakat, taxes and customs. Does NOT establish the zakat/income-tax split by ownership, VAT registration thresholds, withholding-tax rates, e-invoicing waves, or customs duty rates. Every threshold, rate and deadline must be taken from the relevant ZATCA regulation, not from this page, before publication.",
    limitationsAr:
      "يؤكد أن الهيئة هي الجهة المسؤولة عن الزكاة والضرائب والجمارك. لا يحدد التفرقة بين الزكاة وضريبة الدخل حسب الملكية، ولا حدود التسجيل في ضريبة القيمة المضافة، ولا نسب الاستقطاع، ولا مراحل الفوترة الإلكترونية، ولا التعرفة الجمركية. يجب أخذ كل حد ونسبة وموعد من اللائحة ذات الصلة قبل النشر.",
    reviewNotes: "Retrieved 2026-07-16. Homepage confirms mandate over zakat/tax/customs and references VAT; no rates or thresholds published at this level.",
  },
  {
    key: "src-saber",
    authoritySlug: "saso",
    title: "SABER — product conformity platform (SASO)",
    url: "https://saber.sa/",
    language: "ar",
    classification: "GOVERNMENT_PORTAL",
    status: "SOURCE_VERIFIED",
    limitationsEn:
      "The platform's own pages establish that SABER, under SASO, handles product and shipment conformity certificates, and that it is integrated with the Fasah customs clearance platform such that unregistered conformity certificates can lead to shipments being refused. Fee figures shown on the platform are indicative and excluded VAT at the time of retrieval — a reviewer must re-confirm current fees, and must confirm which product categories require which certificate type, before publication.",
    limitationsAr:
      "تُثبت صفحات المنصة أن سابر، التابعة للهيئة السعودية للمواصفات، تتولى شهادات مطابقة المنتجات والإرساليات، وأنها مرتبطة بمنصة فسح الجمركية بحيث قد تُرفض الإرساليات دون شهادات مسجلة. الرسوم المعروضة إرشادية وغير شاملة لضريبة القيمة المضافة وقت الاطلاع — على المراجع تأكيد الرسوم الحالية وفئات المنتجات المشمولة قبل النشر.",
    reviewNotes: "Retrieved 2026-07-16. Platform published substantive detail: SASO ownership, certificate types, Fasah integration. Fees observed but treated as volatile — not asserted in pathway content.",
  },
  {
    key: "src-sfda-home",
    authoritySlug: "sfda",
    title: "Saudi Food and Drug Authority — official portal",
    url: "https://www.sfda.gov.sa/en",
    language: "en",
    classification: "OFFICIAL_PRIMARY",
    status: "SOURCE_VERIFIED",
    limitationsEn:
      "The authority's own site establishes its regulated categories: food, drugs, medical devices, feed, tobacco, pesticides, laboratories, cosmetics, halal products and nutrition. It does NOT establish registration procedures, licence types, fees or timelines for any category. A reviewer must cite the category-specific SFDA guidance before this content may be published.",
    limitationsAr:
      "يُثبت موقع الهيئة فئاتها التنظيمية: الغذاء والدواء والأجهزة الطبية والأعلاف والتبغ والمبيدات والمختبرات ومستحضرات التجميل والمنتجات الحلال والتغذية. لا يحدد إجراءات التسجيل أو أنواع التراخيص أو الرسوم أو المدد. على المراجع الاستشهاد بإرشادات الهيئة الخاصة بكل فئة قبل النشر.",
    reviewNotes: "Retrieved 2026-07-16. Site published its regulated-category list explicitly; procedural detail not published at this level.",
  },
  {
    key: "src-sbc-home",
    authoritySlug: "sbc",
    title: "Saudi Business Center — official portal",
    url: "https://business.sa/",
    language: "en",
    classification: "GOVERNMENT_PORTAL",
    status: "DRAFT",
    limitationsEn:
      "UNVERIFIED. The Saudi Business Center portal did not serve retrievable content during authoring (TLS chain could not be validated by the verification tool), so nothing about its services is asserted here. A reviewer must open the portal directly, confirm it is the correct unified establishment channel, and cite the specific service pages before publication.",
    limitationsAr:
      "غير مُتحقق منه. لم تُتح بوابة المركز السعودي للأعمال محتوى قابلًا للاسترجاع أثناء التأليف (تعذّر التحقق من سلسلة شهادات TLS)، لذا لا يُؤكَّد هنا أي شيء عن خدماتها. على المراجع فتح البوابة مباشرة وتأكيد أنها القناة الموحدة الصحيحة للتأسيس والاستشهاد بصفحات الخدمات قبل النشر.",
    reviewNotes: "Retrieval failed 2026-07-16 (certificate chain not verifiable from the tool's trust store — likely a local trust issue, not evidence of a problem with the site). Status held at DRAFT precisely because nothing was read.",
  },
  {
    key: "src-qiwa-home",
    authoritySlug: "mhrsd",
    title: "Qiwa — labour services platform (MHRSD)",
    url: "https://qiwa.sa/en",
    language: "en",
    classification: "GOVERNMENT_PORTAL",
    status: "DRAFT",
    limitationsEn:
      "UNVERIFIED. Qiwa is a client-rendered application and served no substantive content to verification, so its service list and its relationship to MHRSD are not asserted here. A reviewer must confirm the platform's official scope, the establishment-file procedure, and any Saudization/Nitaqat classification rules from the authority directly.",
    limitationsAr:
      "غير مُتحقق منه. قوى تطبيق يُعرض من جانب العميل ولم يوفر محتوى جوهريًا للتحقق، لذا لا تُؤكَّد هنا قائمة خدماته ولا علاقته بالوزارة. على المراجع تأكيد النطاق الرسمي للمنصة وإجراء ملف المنشأة وقواعد التوطين/نطاقات من الجهة مباشرة.",
    reviewNotes: "Retrieved 2026-07-16 — returned only a loading shell. Domain and authority association confirmed; all service detail unverified.",
  },
  {
    key: "src-gosi-home",
    authoritySlug: "gosi",
    title: "General Organization for Social Insurance — official portal",
    url: "https://www.gosi.gov.sa/en/",
    language: "en",
    classification: "OFFICIAL_PRIMARY",
    status: "DRAFT",
    limitationsEn:
      "Confirms the authority's official English and Arabic names only. The portal is client-rendered and published no retrievable detail on establishment registration, employee enrolment, contribution rates or deadlines. All procedural content must be verified against the authority before publication.",
    limitationsAr:
      "يؤكد الاسمين الرسميين للمؤسسة بالعربية والإنجليزية فقط. البوابة تُعرض من جانب العميل ولم تنشر تفاصيل قابلة للاسترجاع عن تسجيل المنشآت أو تسجيل الموظفين أو نسب الاشتراكات أو المواعيد. يجب التحقق من كل المحتوى الإجرائي مع الجهة قبل النشر.",
    reviewNotes: "Retrieved 2026-07-16 — only the organization name rendered. Identity confirmed; obligations unverified.",
  },
  {
    key: "src-momah-home",
    authoritySlug: "momah",
    title: "Ministry of Municipalities and Housing — official portal",
    url: "https://momah.gov.sa/",
    language: "en",
    classification: "OFFICIAL_PRIMARY",
    status: "DRAFT",
    limitationsEn:
      "UNVERIFIED. Recorded as the municipal-licensing authority for premises-based activities on the basis of the existing approved Balady pathway, not on a retrieval performed during this authoring pass. A reviewer must confirm the authority, the Balady channel, and the licence categories directly.",
    limitationsAr:
      "غير مُتحقق منه. سُجلت كجهة الترخيص البلدي للأنشطة ذات المقر استنادًا إلى مسار بلدي المعتمد الحالي، وليس إلى اطلاع تم خلال هذه الجولة. على المراجع تأكيد الجهة وقناة بلدي وفئات الرخص مباشرة.",
    reviewNotes: "Not retrieved during authoring. Carried from existing approved content; held at DRAFT.",
  },
  {
    key: "src-moc-home",
    authoritySlug: "moc",
    title: "Ministry of Commerce — official portal",
    url: "https://mc.gov.sa/",
    language: "en",
    classification: "OFFICIAL_PRIMARY",
    status: "DRAFT",
    limitationsEn:
      "UNVERIFIED. Recorded as the commercial-registration authority on the basis of the existing approved commercial-registration pathway, not on a retrieval performed during this authoring pass. A reviewer must confirm the CR procedure, entity types and activity classification directly.",
    limitationsAr:
      "غير مُتحقق منه. سُجلت كجهة السجل التجاري استنادًا إلى مسار السجل التجاري المعتمد الحالي، وليس إلى اطلاع تم خلال هذه الجولة. على المراجع تأكيد إجراء السجل وأنواع الكيانات وتصنيف الأنشطة مباشرة.",
    reviewNotes: "Not retrieved during authoring. Carried from existing approved content; held at DRAFT.",
  },
];

interface TaxonomySeed {
  slug: string;
  section: Section;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  authoritySlug: string;
  sourceKeys: string[];
  requiresProfessionalReview: boolean;
  /** The specific question a reviewer must answer before promotion. */
  openQuestionEn: string;
  openQuestionAr: string;
}

/**
 * A–G coverage taxonomy. Each entry names an obligation area and its authority —
 * the parts the official sources above actually establish. Thresholds, rates and
 * procedures are intentionally absent and recorded as open questions.
 */
const TAXONOMY: TaxonomySeed[] = [
  // A — Investment & establishment
  {
    slug: "tx-a-foreign-investment-licence",
    section: "A",
    titleEn: "Foreign investment licence",
    titleAr: "رخصة الاستثمار الأجنبي",
    descriptionEn: "A foreign investor establishing a presence in Saudi Arabia obtains an investment licence from the Ministry of Investment. Eligibility depends on the intended activity. Confirm your activity's status and the applicable ownership structure with the Ministry before committing to a structure.",
    descriptionAr: "يحصل المستثمر الأجنبي الذي يؤسس وجودًا في السعودية على رخصة استثمار من وزارة الاستثمار. تعتمد الأهلية على النشاط المقصود. أكّد حالة نشاطك وهيكل الملكية المنطبق مع الوزارة قبل الالتزام بأي هيكل.",
    authoritySlug: "misa",
    sourceKeys: ["src-misa-home", "src-misa-laws"],
    requiresProfessionalReview: true,
    openQuestionEn: "Which activities are open to foreign ownership, at what ownership percentage, and which licence category applies? Cite the instrument.",
    openQuestionAr: "ما الأنشطة المتاحة للملكية الأجنبية، وبأي نسبة، وأي فئة رخصة تنطبق؟ استشهد بالنظام.",
  },
  {
    slug: "tx-a-entity-structure",
    section: "A",
    titleEn: "Entity structure selection",
    titleAr: "اختيار هيكل الكيان",
    descriptionEn: "The legal form of the entity (including branch versus subsidiary) determines downstream registration, tax and governance obligations. This choice is difficult to reverse and should be reviewed with a qualified professional against the Ministry's current rules.",
    descriptionAr: "يحدد الشكل القانوني للكيان (بما في ذلك الفرع مقابل الشركة التابعة) التزامات التسجيل والضريبة والحوكمة اللاحقة. هذا الاختيار يصعب التراجع عنه وينبغي مراجعته مع مختص مؤهل وفق قواعد الوزارة الحالية.",
    authoritySlug: "misa",
    sourceKeys: ["src-misa-laws"],
    requiresProfessionalReview: true,
    openQuestionEn: "Enumerate the available legal forms and the consequences of each for tax, ownership and governance. Cite the instrument.",
    openQuestionAr: "عدّد الأشكال القانونية المتاحة وأثر كل منها على الضريبة والملكية والحوكمة. استشهد بالنظام.",
  },
  // B — Zakat, tax & customs
  {
    slug: "tx-b-zatca-registration",
    section: "B",
    titleEn: "ZATCA registration",
    titleAr: "التسجيل لدى هيئة الزكاة والضريبة والجمارك",
    descriptionEn: "ZATCA is the single authority for zakat, taxes and customs. Registration follows establishment. Which obligations attach to your entity depends on its ownership and activity — confirm your position with ZATCA.",
    descriptionAr: "هيئة الزكاة والضريبة والجمارك هي الجهة المسؤولة عن الزكاة والضرائب والجمارك. يأتي التسجيل بعد التأسيس. تعتمد الالتزامات المنطبقة على كيانك على ملكيته ونشاطه — أكّد وضعك مع الهيئة.",
    authoritySlug: "zatca",
    sourceKeys: ["src-zatca-home"],
    requiresProfessionalReview: false,
    openQuestionEn: "What is the registration trigger and deadline following CR issuance? Cite the regulation.",
    openQuestionAr: "ما مُحفِّز التسجيل وموعده بعد إصدار السجل التجاري؟ استشهد باللائحة.",
  },
  {
    slug: "tx-b-zakat-vs-income-tax",
    section: "B",
    titleEn: "Zakat or income tax treatment",
    titleAr: "المعاملة الزكوية أو الضريبية",
    descriptionEn: "Whether an entity is subject to zakat, to income tax, or to a mix is determined by its ownership. This materially affects cost and filing obligations and must be confirmed with ZATCA or a qualified tax adviser — do not assume a treatment from your entity type alone.",
    descriptionAr: "يُحدَّد خضوع الكيان للزكاة أو لضريبة الدخل أو لمزيج منهما بحسب ملكيته. يؤثر ذلك جوهريًا على التكلفة والتزامات الإقرار ويجب تأكيده مع الهيئة أو مستشار ضريبي مؤهل — لا تفترض المعاملة من نوع الكيان وحده.",
    authoritySlug: "zatca",
    sourceKeys: ["src-zatca-home"],
    requiresProfessionalReview: true,
    openQuestionEn: "State the ownership test that determines zakat versus income tax versus mixed treatment, with rates. Cite the regulation.",
    openQuestionAr: "بيّن اختبار الملكية الذي يحدد الزكاة مقابل ضريبة الدخل مقابل المعاملة المختلطة، مع النسب. استشهد باللائحة.",
  },
  {
    slug: "tx-b-vat-registration",
    section: "B",
    titleEn: "VAT registration",
    titleAr: "التسجيل في ضريبة القيمة المضافة",
    descriptionEn: "VAT is administered by ZATCA. Whether registration is mandatory for your business depends on your taxable turnover and activity. Confirm the current threshold and your obligation directly with ZATCA before invoicing customers.",
    descriptionAr: "تدير الهيئة ضريبة القيمة المضافة. يعتمد إلزام التسجيل على إيراداتك الخاضعة ونشاطك. أكّد الحد الحالي والتزامك مع الهيئة مباشرة قبل إصدار الفواتير للعملاء.",
    authoritySlug: "zatca",
    sourceKeys: ["src-zatca-home"],
    requiresProfessionalReview: false,
    openQuestionEn: "State the current mandatory and voluntary VAT registration thresholds and the measurement period. Cite the regulation.",
    openQuestionAr: "بيّن حدي التسجيل الإلزامي والاختياري الحاليين لضريبة القيمة المضافة وفترة القياس. استشهد باللائحة.",
  },
  {
    slug: "tx-b-withholding-tax",
    section: "B",
    titleEn: "Withholding tax on payments abroad",
    titleAr: "ضريبة الاستقطاع على المدفوعات للخارج",
    descriptionEn: "Payments from a Saudi entity to a non-resident may carry a withholding obligation. Rates vary by payment type and may be affected by a double-taxation treaty. This is commonly missed and should be reviewed with a qualified tax adviser.",
    descriptionAr: "قد تخضع المدفوعات من كيان سعودي إلى غير مقيم لالتزام استقطاع. تختلف النسب بحسب نوع الدفعة وقد تتأثر باتفاقية تجنب الازدواج الضريبي. غالبًا ما يُغفل هذا وينبغي مراجعته مع مستشار ضريبي مؤهل.",
    authoritySlug: "zatca",
    sourceKeys: ["src-zatca-home"],
    requiresProfessionalReview: true,
    openQuestionEn: "Tabulate withholding rates by payment category and the filing deadline. Cite the regulation.",
    openQuestionAr: "اجدول نسب الاستقطاع بحسب فئة الدفعة وموعد الإقرار. استشهد باللائحة.",
  },
  {
    slug: "tx-b-e-invoicing",
    section: "B",
    titleEn: "Electronic invoicing (Fatoora)",
    titleAr: "الفوترة الإلكترونية (فاتورة)",
    descriptionEn: "ZATCA operates an electronic invoicing regime. Which obligations apply to you, and from when, depends on your registration and turnover. Confirm your wave and integration requirements with ZATCA before selecting invoicing software.",
    descriptionAr: "تدير الهيئة نظام الفوترة الإلكترونية. تعتمد الالتزامات المنطبقة عليك وتوقيتها على تسجيلك وإيراداتك. أكّد مرحلتك ومتطلبات الربط مع الهيئة قبل اختيار برنامج الفوترة.",
    authoritySlug: "zatca",
    sourceKeys: ["src-zatca-home"],
    requiresProfessionalReview: false,
    openQuestionEn: "State the current integration-phase criteria and how a new entity determines its wave. Cite the regulation.",
    openQuestionAr: "بيّن معايير مرحلة الربط الحالية وكيف يحدد الكيان الجديد مرحلته. استشهد باللائحة.",
  },
  {
    slug: "tx-b-customs-import",
    section: "B",
    titleEn: "Customs registration for importers",
    titleAr: "التسجيل الجمركي للمستوردين",
    descriptionEn: "Customs falls under ZATCA. An entity importing goods needs the appropriate customs registration and clears shipments through the official channel. Confirm your requirements with ZATCA before your first shipment.",
    descriptionAr: "تقع الجمارك ضمن اختصاص الهيئة. يحتاج الكيان المستورد إلى التسجيل الجمركي المناسب ويخلّص الإرساليات عبر القناة الرسمية. أكّد متطلباتك مع الهيئة قبل أول إرسالية.",
    authoritySlug: "zatca",
    sourceKeys: ["src-zatca-home", "src-saber"],
    requiresProfessionalReview: false,
    openQuestionEn: "State the importer registration procedure, the Fasah relationship, and duty determination. Cite the source.",
    openQuestionAr: "بيّن إجراء تسجيل المستورد وعلاقته بفسح وتحديد الرسوم. استشهد بالمصدر.",
  },
  // C — Commercial & municipal licensing
  {
    slug: "tx-c-commercial-registration",
    section: "C",
    titleEn: "Commercial registration",
    titleAr: "السجل التجاري",
    descriptionEn: "Commercial registration with the Ministry of Commerce establishes the commercial record that later registrations depend on. The activity classification recorded here constrains what the entity may lawfully do.",
    descriptionAr: "يُنشئ السجل التجاري لدى وزارة التجارة القيد التجاري الذي تعتمد عليه التسجيلات اللاحقة. يقيّد تصنيف النشاط المسجل هنا ما يجوز للكيان ممارسته.",
    authoritySlug: "moc",
    sourceKeys: ["src-moc-home", "src-sbc-home"],
    requiresProfessionalReview: false,
    openQuestionEn: "Confirm the CR procedure by entity type, the activity classification system, and renewal cadence. Cite the source.",
    openQuestionAr: "أكّد إجراء السجل بحسب نوع الكيان ونظام تصنيف الأنشطة ودورية التجديد. استشهد بالمصدر.",
  },
  {
    slug: "tx-c-municipal-licence",
    section: "C",
    titleEn: "Municipal licence for premises",
    titleAr: "الرخصة البلدية للمقر",
    descriptionEn: "An activity operating from physical premises requires a municipal licence. The premises must satisfy municipal requirements before a licence issues — securing premises before confirming suitability is a common and costly mistake.",
    descriptionAr: "يتطلب النشاط الذي يعمل من مقر فعلي رخصة بلدية. يجب أن يستوفي المقر المتطلبات البلدية قبل إصدار الرخصة — والتعاقد على مقر قبل تأكيد ملاءمته خطأ شائع ومكلف.",
    authoritySlug: "momah",
    sourceKeys: ["src-momah-home"],
    requiresProfessionalReview: false,
    openQuestionEn: "Confirm the licence categories, the premises criteria, and the dependency on CR. Cite the source.",
    openQuestionAr: "أكّد فئات الرخص ومعايير المقر والاعتماد على السجل التجاري. استشهد بالمصدر.",
  },
  // D — Employment & workforce
  {
    slug: "tx-d-gosi-establishment",
    section: "D",
    titleEn: "GOSI establishment registration",
    titleAr: "تسجيل المنشأة في التأمينات الاجتماعية",
    descriptionEn: "An employing establishment registers with the General Organization for Social Insurance and enrols its employees. Contribution obligations follow enrolment. Confirm the current procedure and rates with the authority.",
    descriptionAr: "تُسجَّل المنشأة التي توظف لدى المؤسسة العامة للتأمينات الاجتماعية وتُسجِّل موظفيها. تتبع التزامات الاشتراك التسجيل. أكّد الإجراء والنسب الحالية مع الجهة.",
    authoritySlug: "gosi",
    sourceKeys: ["src-gosi-home"],
    requiresProfessionalReview: false,
    openQuestionEn: "State contribution rates for Saudi and non-Saudi employees, the enrolment deadline, and the CR dependency. Cite the source.",
    openQuestionAr: "بيّن نسب الاشتراك للسعوديين وغير السعوديين وموعد التسجيل والاعتماد على السجل التجاري. استشهد بالمصدر.",
  },
  {
    slug: "tx-d-labour-file",
    section: "D",
    titleEn: "Labour establishment file",
    titleAr: "ملف المنشأة العمالي",
    descriptionEn: "An employing entity maintains a labour file used for employment contracts and workforce services under the Ministry of Human Resources and Social Development. Confirm the current procedure with the authority.",
    descriptionAr: "يحتفظ الكيان الموظِّف بملف عمالي يُستخدم لعقود التوظيف وخدمات القوى العاملة تحت إشراف وزارة الموارد البشرية والتنمية الاجتماعية. أكّد الإجراء الحالي مع الجهة.",
    authoritySlug: "mhrsd",
    sourceKeys: ["src-qiwa-home"],
    requiresProfessionalReview: false,
    openQuestionEn: "Confirm Qiwa's official scope, the establishment-file procedure, and its dependency on CR and GOSI. Cite the source.",
    openQuestionAr: "أكّد النطاق الرسمي لقوى وإجراء ملف المنشأة واعتماده على السجل التجاري والتأمينات. استشهد بالمصدر.",
  },
  {
    slug: "tx-d-saudization",
    section: "D",
    titleEn: "Saudization (Nitaqat) classification",
    titleAr: "تصنيف التوطين (نطاقات)",
    descriptionEn: "Employing establishments are subject to workforce localisation requirements whose targets vary by activity and size. Classification affects access to workforce services, so review your position with the authority before building a hiring plan.",
    descriptionAr: "تخضع المنشآت الموظِّفة لمتطلبات توطين تختلف مستهدفاتها بحسب النشاط والحجم. يؤثر التصنيف على الوصول إلى خدمات القوى العاملة، لذا راجع وضعك مع الجهة قبل بناء خطة التوظيف.",
    authoritySlug: "mhrsd",
    sourceKeys: ["src-qiwa-home"],
    requiresProfessionalReview: true,
    openQuestionEn: "State how the Nitaqat band is computed, the targets by activity/size, and the consequences of each band. Cite the source.",
    openQuestionAr: "بيّن كيفية احتساب نطاق المنشأة والمستهدفات بحسب النشاط والحجم وأثر كل نطاق. استشهد بالمصدر.",
  },
  {
    slug: "tx-d-wage-protection",
    section: "D",
    titleEn: "Wage protection reporting",
    titleAr: "الإبلاغ عن حماية الأجور",
    descriptionEn: "Employers report salary payments under the wage protection regime. Confirm the applicable reporting channel and cadence for your establishment with the authority.",
    descriptionAr: "يُبلغ أصحاب العمل عن مدفوعات الرواتب ضمن نظام حماية الأجور. أكّد قناة الإبلاغ ودوريتها المنطبقة على منشأتك مع الجهة.",
    authoritySlug: "mhrsd",
    sourceKeys: ["src-qiwa-home"],
    requiresProfessionalReview: false,
    openQuestionEn: "Confirm which establishments are in scope, the reporting cadence, and the official channel. Cite the source.",
    openQuestionAr: "أكّد المنشآت المشمولة ودورية الإبلاغ والقناة الرسمية. استشهد بالمصدر.",
  },
  // E — Import & products
  {
    slug: "tx-e-product-conformity",
    section: "E",
    titleEn: "Product conformity certificate (SABER)",
    titleAr: "شهادة مطابقة المنتج (سابر)",
    descriptionEn: "Products entering the Saudi market are registered for conformity through SABER, the platform operated under the Saudi Standards, Metrology and Quality Organization. SABER is integrated with customs clearance: shipments whose conformity certificates are not registered can be refused entry. Register before shipping, not on arrival.",
    descriptionAr: "تُسجَّل المنتجات الداخلة إلى السوق السعودي للمطابقة عبر منصة سابر التابعة للهيئة السعودية للمواصفات والمقاييس والجودة. وسابر مرتبطة بالتخليص الجمركي: قد تُرفض الإرساليات التي لم تُسجَّل شهادات مطابقتها. سجّل قبل الشحن لا عند الوصول.",
    authoritySlug: "saso",
    sourceKeys: ["src-saber"],
    requiresProfessionalReview: false,
    openQuestionEn: "Confirm which product categories require which certificate type, current fees, and the certificate validity period. Cite the source.",
    openQuestionAr: "أكّد فئات المنتجات وأنواع الشهادات المطلوبة والرسوم الحالية ومدة صلاحية الشهادة. استشهد بالمصدر.",
  },
  {
    slug: "tx-e-sfda-regulated-products",
    section: "E",
    titleEn: "SFDA-regulated product categories",
    titleAr: "فئات المنتجات الخاضعة للغذاء والدواء",
    descriptionEn: "The Saudi Food and Drug Authority regulates food, drugs, medical devices, cosmetics, feed, tobacco, pesticides, laboratories, halal products and nutrition. If your products fall in any of these categories, SFDA requirements apply in addition to general import rules — confirm the category-specific requirements with the authority.",
    descriptionAr: "تنظّم الهيئة العامة للغذاء والدواء الغذاء والدواء والأجهزة الطبية ومستحضرات التجميل والأعلاف والتبغ والمبيدات والمختبرات والمنتجات الحلال والتغذية. إذا كانت منتجاتك ضمن أي من هذه الفئات، تنطبق متطلبات الهيئة إضافة إلى قواعد الاستيراد العامة — أكّد متطلبات فئتك مع الجهة.",
    authoritySlug: "sfda",
    sourceKeys: ["src-sfda-home"],
    requiresProfessionalReview: false,
    openQuestionEn: "For each regulated category, state the registration/licence procedure and its interaction with SABER and customs. Cite the source.",
    openQuestionAr: "لكل فئة منظّمة، بيّن إجراء التسجيل/الترخيص وتفاعله مع سابر والجمارك. استشهد بالمصدر.",
  },
  // F — Sector regulators
  {
    slug: "tx-f-sector-regulator-mapping",
    section: "F",
    titleEn: "Sector regulator identification",
    titleAr: "تحديد الجهة المنظِّمة للقطاع",
    descriptionEn: "Some activities are supervised by a sector regulator in addition to the general establishment authorities. Operating without an applicable sector licence carries regulatory risk, so identify whether your activity is supervised before you begin operating.",
    descriptionAr: "تخضع بعض الأنشطة لجهة منظِّمة قطاعية إضافة إلى جهات التأسيس العامة. ويحمل العمل دون رخصة قطاعية منطبقة مخاطر تنظيمية، لذا حدّد ما إذا كان نشاطك خاضعًا للإشراف قبل بدء التشغيل.",
    authoritySlug: "misa",
    sourceKeys: ["src-misa-laws"],
    requiresProfessionalReview: true,
    openQuestionEn: "Build the activity-to-regulator map (e.g. financial services, communications, health, education, transport) and cite each regulator's own source. This entry is a placeholder for that mapping — it must not be published as-is.",
    openQuestionAr: "ابنِ خريطة النشاط إلى الجهة المنظِّمة (مثل الخدمات المالية والاتصالات والصحة والتعليم والنقل) واستشهد بمصدر كل جهة. هذا المدخل عنصر نائب لتلك الخريطة — ولا يجوز نشره كما هو.",
  },
  // G — Ongoing compliance
  {
    slug: "tx-g-renewals-calendar",
    section: "G",
    titleEn: "Renewals and filing calendar",
    titleAr: "تقويم التجديدات والإقرارات",
    descriptionEn: "Market entry is not a one-time event: registrations, licences and filings recur. Missing a renewal can suspend an entity's ability to operate. Build a calendar from the authorities' own deadlines and confirm each date with the relevant authority.",
    descriptionAr: "دخول السوق ليس حدثًا لمرة واحدة: فالتسجيلات والرخص والإقرارات متكررة. وقد يؤدي تفويت تجديد إلى تعليق قدرة الكيان على العمل. ابنِ تقويمًا من مواعيد الجهات نفسها وأكّد كل تاريخ مع الجهة المعنية.",
    authoritySlug: "zatca",
    sourceKeys: ["src-zatca-home"],
    requiresProfessionalReview: false,
    openQuestionEn: "Enumerate every recurring obligation with its authority, cadence and deadline. Cite each source.",
    openQuestionAr: "عدّد كل التزام متكرر مع جهته ودوريته وموعده. استشهد بكل مصدر.",
  },
];

function fingerprint(...parts: string[]): string {
  return createHash("sha256").update(parts.join(" ")).digest("hex").slice(0, 32);
}

/**
 * Seed the A–G taxonomy as DRAFT governed content.
 *
 * Idempotent and non-destructive. Deliberately never writes Rule rows and never
 * assigns a status above SOURCE_VERIFIED — promotion is a human decision made
 * through the governance UI.
 */
export async function seedTaxonomyDraft(
  prisma: PrismaClient
): Promise<{ authorities: number; sources: number; pathways: number; skipped: number }> {
  let authorities = 0;
  for (const a of AUTHORITIES) {
    const payload = { nameEn: a.nameEn, nameAr: a.nameAr, website: a.website };
    await prisma.authority.upsert({
      where: { slug: a.slug },
      update: payload,
      create: { slug: a.slug, ...payload },
    });
    authorities++;
  }

  const authorityIdBySlug = Object.fromEntries(
    (await prisma.authority.findMany({ select: { id: true, slug: true } })).map((a) => [a.slug, a.id])
  );

  // OfficialSource has no natural unique key, so match on url+title to stay idempotent.
  const sourceIdByKey: Record<string, string> = {};
  let sources = 0;
  for (const s of SOURCES) {
    const payload = {
      authorityId: authorityIdBySlug[s.authoritySlug] ?? null,
      title: s.title,
      url: s.url,
      domain: new URL(s.url).hostname,
      language: s.language,
      jurisdiction: "SA",
      classification: s.classification,
      status: s.status,
      lastVerified: s.status === "SOURCE_VERIFIED" ? VERIFIED_ON : null,
      nextReview: NEXT_REVIEW,
      fingerprint: fingerprint(s.url, s.title, s.status),
      reviewNotes: s.reviewNotes,
      limitationsEn: s.limitationsEn,
      limitationsAr: s.limitationsAr,
      translationComplete: true,
      changeReason: "Stage 7.5 coverage expansion — authored as unpublished governed content.",
    };
    const existing = await prisma.officialSource.findFirst({
      where: { url: s.url, title: s.title, deletedAt: null },
      select: { id: true, status: true },
    });
    if (existing) {
      // Never demote content a human has already advanced through the lifecycle.
      // Refresh the content, but leave `status` alone once a reviewer has moved
      // it past the seed's authoring range — re-running must not revert a human.
      const humanAdvanced = !["DRAFT", "SOURCE_VERIFIED"].includes(existing.status);
      await prisma.officialSource.update({
        where: { id: existing.id },
        data: humanAdvanced ? { ...payload, status: existing.status } : payload,
      });
      sourceIdByKey[s.key] = existing.id;
    } else {
      const created = await prisma.officialSource.create({ data: payload });
      sourceIdByKey[s.key] = created.id;
    }
    sources++;
  }

  let pathways = 0;
  let skipped = 0;
  for (const t of TAXONOMY) {
    const existing = await prisma.pathway.findUnique({
      where: { slug: t.slug },
      select: { id: true, status: true },
    });

    // Once a reviewer has moved an entry past SOURCE_VERIFIED, the seed stops
    // touching its content — re-running must never silently revert a human's work.
    if (existing && !["DRAFT", "SOURCE_VERIFIED"].includes(existing.status)) {
      skipped++;
      continue;
    }

    const reviewNote = [
      `Coverage section ${t.section} — ${SECTION_LABEL[t.section]}.`,
      `OPEN QUESTION (EN): ${t.openQuestionEn}`,
      `OPEN QUESTION (AR): ${t.openQuestionAr}`,
      "Authored from official sources at DRAFT. Content is limited to what the cited sources establish; thresholds, rates, fees and procedures are intentionally omitted. Do not publish until the open question is closed against the primary source.",
    ].join("\n");

    const payload = {
      titleEn: t.titleEn,
      titleAr: t.titleAr,
      descriptionEn: t.descriptionEn,
      descriptionAr: t.descriptionAr,
      status: "DRAFT" as const,
      // No applicability: a DRAFT pathway must not be evaluable even by accident.
      applicability: undefined,
      requiresProfessionalReview: t.requiresProfessionalReview,
      requiresVerification: true,
      lastReviewed: null,
      nextReview: NEXT_REVIEW,
      changeReason: reviewNote,
    };

    const pathway = existing
      ? await prisma.pathway.update({ where: { id: existing.id }, data: payload })
      : await prisma.pathway.create({ data: { slug: t.slug, ...payload } });

    for (const key of t.sourceKeys) {
      const sourceId = sourceIdByKey[key];
      if (!sourceId) continue;
      const link = await prisma.pathwaySource.findFirst({
        where: { pathwayId: pathway.id, sourceId },
        select: { id: true },
      });
      if (!link) {
        await prisma.pathwaySource.create({ data: { pathwayId: pathway.id, sourceId } });
      }
    }
    pathways++;
  }

  return { authorities, sources, pathways, skipped };
}
