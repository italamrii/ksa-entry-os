"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/layout/site-header";
import { COMPANY_TYPES, ENTRY_GOALS } from "@/lib/constants";
import { toast } from "sonner";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      if (!res.ok) {
        toast.error("Failed to save");
        return;
      }
      toast.success("Profile updated!");
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader isAuthenticated />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Complete your profile</CardTitle>
            <CardDescription>Help us personalize your Saudi market entry roadmap</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company name</Label>
                <Input id="companyName" name="companyName" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input id="country" name="country" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="companyType">Company type</Label>
                <Select id="companyType" name="companyType" required className="mt-1">
                  <option value="">Select</option>
                  {COMPANY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.labelEn}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="entryGoal">Entry goal</Label>
                <Select id="entryGoal" name="entryGoal" required className="mt-1">
                  <option value="">Select</option>
                  {ENTRY_GOALS.map((g) => (
                    <option key={g.value} value={g.value}>{g.labelEn}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="locale">Preferred language</Label>
                <Select id="locale" name="locale" defaultValue="en" className="mt-1">
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saving..." : "Continue to dashboard"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
