"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/site-header";
import { COMPANY_TYPES, ENTRY_GOALS } from "@/lib/constants";
import { toast } from "sonner";
import { localeHref } from "@/lib/i18n/locale-utils";
import { useLocale } from "@/lib/i18n/use-locale";
import { getOnboarding, getAuth } from "@/lib/i18n/content";

function OnboardingForm() {
  const router = useRouter();
  const urlLocale = useLocale();
  const O = getOnboarding(urlLocale);
  const A = getAuth(urlLocale);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const chosenLocale = form.get("locale") === "ar" ? "ar" as const : "en" as const;
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      if (!res.ok) {
        toast.error(O.saveFailed);
        return;
      }
      toast.success(O.profileUpdated);
      router.push(localeHref("/dashboard", chosenLocale));
      router.refresh();
    } catch {
      toast.error(A.somethingWrong);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-stage flex min-h-screen flex-col">
      <SiteHeader locale={urlLocale} isAuthenticated />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="surface-panel w-full max-w-lg overflow-hidden rounded-[var(--radius-lg)]">
          <div className="border-b border-[var(--border-subtle)] px-6 py-5">
            <p className="text-overline">{O.overline}</p>
            <h1 className="font-display mt-1 text-xl font-semibold text-foreground">
              {O.title}
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {O.subtitle}
            </p>
          </div>
          <div className="px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="companyName">{A.companyName}</Label>
                <Input id="companyName" name="companyName" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="country">{A.country}</Label>
                <Input id="country" name="country" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="companyType">{A.companyType}</Label>
                <Select id="companyType" name="companyType" required className="mt-1">
                  <option value="">{O.select}</option>
                  {COMPANY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{urlLocale === "ar" ? t.labelAr : t.labelEn}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="entryGoal">{A.entryGoal}</Label>
                <Select id="entryGoal" name="entryGoal" required className="mt-1">
                  <option value="">{O.select}</option>
                  {ENTRY_GOALS.map((g) => (
                    <option key={g.value} value={g.value}>{urlLocale === "ar" ? g.labelAr : g.labelEn}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="locale">{O.preferredLanguage}</Label>
                <Select id="locale" name="locale" defaultValue={urlLocale} className="mt-1">
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? O.saving : O.continueBtn}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingForm />
    </Suspense>
  );
}
