"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { SiteHeader } from "@/components/layout/site-header";
import { toast } from "sonner";
import { APP_NAME } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
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
        toast.error(json.error ?? "Login failed");
        return;
      }
      toast.success("Welcome back!");
      router.push(json.onboardingDone === false ? "/onboarding" : "/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-stage flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="surface-panel w-full max-w-md overflow-hidden rounded-[var(--radius-lg)]">
          <div className="border-b border-[var(--border-subtle)] px-6 py-5">
            <p className="text-overline">KSA Entry OS</p>
            <h1 className="font-display mt-1 text-xl font-semibold text-foreground">Log in to {APP_NAME}</h1>
            <p className="mt-1 text-sm text-[var(--muted)]">Enter your credentials to open your decision workspace</p>
          </div>
          <div className="px-6 py-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register("email")} className="mt-1" />
                {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...register("password")} className="mt-1" />
                {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-[var(--muted)]">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-[var(--accent-bright)] hover:underline">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
