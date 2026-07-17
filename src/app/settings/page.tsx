"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { DashboardShell } from "@/components/layout/dashboard-nav";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { toast } from "sonner";
import { localeHref } from "@/lib/i18n/locale-utils";
import { useLocale } from "@/lib/i18n/use-locale";
import { getSettings } from "@/lib/i18n/content";

function SettingsForm() {
  const router = useRouter();
  const locale = useLocale();
  const S = getSettings(locale);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      if (!res.ok) {
        toast.error(S.saveFailed);
        return;
      }
      toast.success(S.saved);
      // Follow the language the user just chose (keeps ?lang in sync).
      const chosenLocale = form.get("locale") === "ar" ? ("ar" as const) : ("en" as const);
      router.push(localeHref("/settings", chosenLocale));
      router.refresh();
    } catch {
      toast.error(S.somethingWrong);
    } finally {
      setLoading(false);
    }
  }

  async function requestDeletion() {
    if (!confirm(S.deletionConfirm)) return;
    try {
      const res = await fetch("/api/data-deletion", { method: "POST" });
      if (!res.ok) {
        toast.error(S.requestFailed);
        return;
      }
      toast.success(S.deletionSubmitted);
    } catch {
      toast.error(S.somethingWrong);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader locale={locale} isAuthenticated />
      <DashboardShell locale={locale} currentPath="/settings">
        <div className="mx-auto max-w-lg space-y-6">
          <div>
            <p className="text-overline">{S.overline}</p>
            <h1 className="font-display mt-1 text-2xl font-semibold text-foreground">{S.title}</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">{S.subtitle}</p>
          </div>

          <section className="surface-panel overflow-hidden rounded-[var(--radius-lg)]">
            <div className="border-b border-[var(--border-subtle)] px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">{S.profile}</h2>
            </div>
            <div className="px-5 py-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">{S.name}</Label>
                  <Input id="name" name="name" required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="locale">{S.language}</Label>
                  <Select id="locale" name="locale" defaultValue={locale} className="mt-1">
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </Select>
                </div>
                <Button type="submit" disabled={loading}>{loading ? S.saving : S.saveChanges}</Button>
              </form>
            </div>
          </section>

          <section className="surface-strip rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--error)_28%,transparent)]">
            <h2 className="text-sm font-semibold text-[var(--error)]">{S.dangerZone}</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {S.deletionInfo}
            </p>
            <Button variant="destructive" className="mt-4" onClick={requestDeletion}>
              {S.requestDeletion}
            </Button>
          </section>
        </div>
      </DashboardShell>
    </div>
  );
}


export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsForm />
    </Suspense>
  );
}
