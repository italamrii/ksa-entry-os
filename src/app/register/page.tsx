"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { SiteHeader, DisclaimerBanner } from "@/components/layout/site-header";
import { COMPANY_TYPES, ENTRY_GOALS, APP_NAME } from "@/lib/constants";
import { localeHref } from "@/lib/i18n/locale-utils";
import { useLocale } from "@/lib/i18n/use-locale";
import { toast } from "sonner";

interface Sector {
  id: string;
  nameEn: string;
}

function RegisterForm() {
  const router = useRouter();
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(registerSchema) as any,
  });

  useEffect(() => {
    fetch("/api/sectors")
      .then((r) => r.json())
      .then(setSectors)
      .catch(() => {});
  }, []);

  async function onSubmit(data: RegisterInput) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Registration failed");
        return;
      }
      toast.success("Account created!");
      router.push(localeHref("/onboarding", locale));
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-stage flex min-h-screen flex-col">
      <SiteHeader locale={locale} />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="surface-panel w-full max-w-lg overflow-hidden rounded-[var(--radius-lg)]">
          <div className="border-b border-[var(--border-subtle)] px-6 py-5">
            <p className="text-overline">KSA Entry OS</p>
            <h1 className="font-display mt-1 text-xl font-semibold text-foreground">
              Create your {APP_NAME} account
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Minimal information only — no sensitive documents required
            </p>
          </div>
          <div className="px-6 py-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" {...register("name")} className="mt-1" />
                  {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register("email")} className="mt-1" />
                  {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...register("password")} className="mt-1" />
                {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
              </div>
              <div>
                <Label htmlFor="companyName">Company name</Label>
                <Input id="companyName" {...register("companyName")} className="mt-1" />
                {errors.companyName && <p className="mt-1 text-xs text-red-400">{errors.companyName.message}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" {...register("country")} className="mt-1" />
                  {errors.country && <p className="mt-1 text-xs text-red-400">{errors.country.message}</p>}
                </div>
                <div>
                  <Label htmlFor="sectorId">Sector</Label>
                  <Select id="sectorId" {...register("sectorId")} className="mt-1">
                    <option value="">Select sector</option>
                    {sectors.map((s) => (
                      <option key={s.id} value={s.id}>{s.nameEn}</option>
                    ))}
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="companyType">Company type</Label>
                <Select id="companyType" {...register("companyType")} className="mt-1">
                  <option value="">Select type</option>
                  {COMPANY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.labelEn}</option>
                  ))}
                </Select>
                {errors.companyType && <p className="mt-1 text-xs text-red-400">{errors.companyType.message}</p>}
              </div>
              <div>
                <Label htmlFor="entryGoal">Goal for entering Saudi Arabia</Label>
                <Select id="entryGoal" {...register("entryGoal")} className="mt-1">
                  <option value="">Select goal</option>
                  {ENTRY_GOALS.map((g) => (
                    <option key={g.value} value={g.value}>{g.labelEn}</option>
                  ))}
                </Select>
                {errors.entryGoal && <p className="mt-1 text-xs text-red-400">{errors.entryGoal.message}</p>}
              </div>
              <DisclaimerBanner />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-[var(--muted)]">
              Already have an account?{" "}
              <Link href="/login" className="text-[var(--accent-bright)] hover:underline">Log in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
