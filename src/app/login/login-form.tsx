"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/site-header";
import { toast } from "sonner";
import { APP_NAME } from "@/lib/constants";
import { localeHref, safeInternalPath } from "@/lib/i18n/locale-utils";
import { useLocale } from "@/lib/i18n/use-locale";
import { getAuth, translateValidation } from "@/lib/i18n/content";

function LoginFormInner() {
  const router = useRouter();
  const locale = useLocale();
  const params = useSearchParams();
  const A = getAuth(locale);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginInput) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? A.loginFailed);
        return;
      }
      toast.success(A.welcomeBack);
      // Honor the middleware's ?next= deep link, but only for safe internal
      // paths; a user who hasn't finished onboarding always goes there first.
      const next = safeInternalPath(params.get("next"));
      const dest = json.onboardingDone === false ? "/onboarding" : (next ?? "/dashboard");
      router.push(localeHref(dest, locale));
      router.refresh();
    } catch {
      toast.error(A.somethingWrong);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-stage flex min-h-screen flex-col">
      <SiteHeader locale={locale} />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="surface-panel w-full max-w-md overflow-hidden rounded-[var(--radius-lg)]">
          <div className="border-b border-[var(--border-subtle)] px-6 py-5">
            <p className="text-overline">KSA Entry OS</p>
            <h1 className="font-display mt-1 text-xl font-semibold text-foreground">
              {A.loginTitle} {APP_NAME}
            </h1>
            <p className="mt-1 text-sm text-[var(--muted)]">{A.loginSubtitle}</p>
          </div>
          <div className="px-6 py-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email">{A.email}</Label>
                <Input id="email" type="email" dir="ltr" {...register("email")} className="mt-1" />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-400">{translateValidation(errors.email.message, locale)}</p>
                )}
              </div>
              <div>
                <Label htmlFor="password">{A.password}</Label>
                <Input id="password" type="password" dir="ltr" {...register("password")} className="mt-1" />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-400">{translateValidation(errors.password.message, locale)}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? A.signingIn : A.signIn}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-[var(--muted)]">
              {A.noAccount}{" "}
              <Link href={localeHref("/register", locale)} className="text-[var(--accent-bright)] hover:underline">
                {A.registerLink}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={null}>
      <LoginFormInner />
    </Suspense>
  );
}
