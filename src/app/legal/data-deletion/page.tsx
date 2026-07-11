import { LegalPageLayout } from "@/components/layout/legal-page";
import Link from "next/link";

export default function DataDeletionPage() {
  return (
    <LegalPageLayout titleEn="Data Deletion Request" titleAr="طلب حذف البيانات">
      <p>
        You have the right to request deletion of your account and associated personal data.
        We will process your request within 30 days.
      </p>
      <h2 className="text-lg font-semibold text-white">What Gets Deleted</h2>
      <ul className="list-disc space-y-1 pl-5">
        <li>Account information</li>
        <li>Assessment responses</li>
        <li>Report requests</li>
        <li>Payment records (excluding legally required financial records)</li>
      </ul>
      <h2 className="text-lg font-semibold text-white">How to Request</h2>
      <p>
        If you have an account, go to{" "}
        <Link href="/settings" className="text-emerald-400 hover:underline">Account Settings</Link>{" "}
        and click &quot;Request data deletion&quot;.
      </p>
      <p>
        Alternatively, email us at privacy@ksaentryos.com with your registered email address.
      </p>
    </LegalPageLayout>
  );
}
