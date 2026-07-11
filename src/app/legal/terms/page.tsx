import { LegalPageLayout } from "@/components/layout/legal-page";

export default function TermsPage() {
  return (
    <LegalPageLayout titleEn="Terms of Use" titleAr="شروط الاستخدام">
      <p>By using KSA Entry OS, you agree to these terms.</p>
      <h2 className="text-lg font-semibold text-white">Service Description</h2>
      <p>
        KSA Entry OS is an advisory navigation platform that provides general guidance and informational
        reports to help companies understand potential steps for entering the Saudi market using public
        official sources.
      </p>
      <h2 className="text-lg font-semibold text-white">Not Professional Advice</h2>
      <p>
        The platform is not a government entity, law firm, tax advisor, accounting firm, or licensed
        consultancy. Information provided does not constitute legal, tax, accounting, or regulatory advice.
      </p>
      <h2 className="text-lg font-semibold text-white">User Responsibilities</h2>
      <p>
        Users are responsible for verifying all requirements with official authorities or licensed
        advisors before making business decisions.
      </p>
      <h2 className="text-lg font-semibold text-white">Account Terms</h2>
      <p>
        You must provide accurate account information. You are responsible for maintaining the security
        of your account credentials.
      </p>
    </LegalPageLayout>
  );
}
