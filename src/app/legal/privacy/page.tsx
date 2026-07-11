import { LegalPageLayout } from "@/components/layout/legal-page";

export default function PrivacyPage() {
  return (
    <LegalPageLayout titleEn="Privacy Policy" titleAr="سياسة الخصوصية">
      <h2 className="text-lg font-semibold text-white">What We Collect</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Account data (name, email, password hash)</li>
        <li>Company name and country</li>
        <li>Business sector and activity</li>
        <li>Assessment responses</li>
        <li>Report requests and payment status</li>
      </ul>
      <h2 className="text-lg font-semibold text-white">What We Do NOT Collect</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Government IDs or passports</li>
        <li>Official documents or uploads</li>
        <li>Bank card numbers or payment card data</li>
        <li>Owner or shareholder personal details</li>
        <li>Financial statements</li>
        <li>Commercial registration numbers</li>
      </ul>
      <h2 className="text-lg font-semibold text-white">Data Storage</h2>
      <p>
        Passwords are hashed using Argon2id. Payment information is limited to provider payment ID,
        amount, currency, status, and invoice number. No card data is stored.
      </p>
      <h2 className="text-lg font-semibold text-white">Your Rights</h2>
      <p>
        You may request deletion of your account and associated data at any time through the
        Data Deletion Request page or account settings.
      </p>
    </LegalPageLayout>
  );
}
