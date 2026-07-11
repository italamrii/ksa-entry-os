"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validation/schemas";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader, DisclaimerBanner } from "@/components/layout/site-header";
import { COMPANY_TYPES, ENTRY_GOALS, APP_NAME } from "@/lib/constants";
import { toast } from "sonner";

interface Sector {
  id: string;
  nameEn: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
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
      router.push("/onboarding");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Create your {APP_NAME} account</CardTitle>
            <CardDescription>Minimal information only — no sensitive documents required</CardDescription>
          </CardHeader>
          <CardContent>
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
            <p className="mt-4 text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link href="/login" className="text-emerald-400 hover:underline">Log in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
