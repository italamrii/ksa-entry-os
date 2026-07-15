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

function SettingsForm() {
  const router = useRouter();
  const locale = useLocale();
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
        toast.error("Failed to save settings");
        return;
      }
      toast.success("Settings saved!");
      // Follow the language the user just chose (keeps ?lang in sync).
      const chosenLocale = form.get("locale") === "ar" ? ("ar" as const) : ("en" as const);
      router.push(localeHref("/settings", chosenLocale));
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function requestDeletion() {
    if (!confirm("Are you sure you want to request account deletion?")) return;
    try {
      const res = await fetch("/api/data-deletion", { method: "POST" });
      if (!res.ok) {
        toast.error("Request failed");
        return;
      }
      toast.success("Deletion request submitted");
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader locale={locale} isAuthenticated />
      <DashboardShell locale={locale} currentPath="/settings">
        <div className="mx-auto max-w-lg space-y-6">
          <div>
            <p className="text-overline">Account</p>
            <h1 className="font-display mt-1 text-2xl font-semibold text-foreground">Settings</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">Profile and language for your decision workspace</p>
          </div>

          <section className="surface-panel overflow-hidden rounded-[var(--radius-lg)]">
            <div className="border-b border-[var(--border-subtle)] px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">Profile</h2>
            </div>
            <div className="px-5 py-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="locale">Language</Label>
                  <Select id="locale" name="locale" defaultValue={locale} className="mt-1">
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </Select>
                </div>
                <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save changes"}</Button>
              </form>
            </div>
          </section>

          <section className="surface-strip rounded-[var(--radius-md)] border border-[color-mix(in_srgb,var(--error)_28%,transparent)]">
            <h2 className="text-sm font-semibold text-[var(--error)]">Danger zone</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Request deletion of your account and associated data.
            </p>
            <Button variant="destructive" className="mt-4" onClick={requestDeletion}>
              Request data deletion
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
