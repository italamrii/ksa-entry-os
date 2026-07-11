import { LegalPageLayout } from "@/components/layout/legal-page";
import { DISCLAIMER_EN, DISCLAIMER_AR } from "@/lib/constants";

export default function DisclaimerPage() {
  return (
    <LegalPageLayout titleEn="Disclaimer" titleAr="إخلاء المسؤولية">
      <p>{DISCLAIMER_EN}</p>
      <h2 className="text-lg font-semibold text-white">Arabic</h2>
      <p dir="rtl">{DISCLAIMER_AR}</p>
      <h2 className="text-lg font-semibold text-white">No Government Affiliation</h2>
      <p>
        KSA Entry OS is an independent private platform. We are not affiliated with, endorsed by,
        or connected to any Saudi government entity.
      </p>
      <h2 className="text-lg font-semibold text-white">Information Accuracy</h2>
      <p>
        Requirements and procedures may change. Information is based on publicly available sources
        and was last reviewed in March 2026. Always verify with official authorities.
      </p>
    </LegalPageLayout>
  );
}
