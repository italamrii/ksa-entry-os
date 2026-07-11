"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { DashboardShell } from "@/components/layout/dashboard-nav";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function SettingsPage() {
  const router = useRouter();
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
      <SiteHeader isAuthenticated />
      <DashboardShell locale="en" currentPath="/settings">
        <div className="mx-auto max-w-lg space-y-6">
          <h1 className="text-2xl font-bold text-white">Account Settings</h1>
          <Card>
            <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="locale">Language</Label>
                  <Select id="locale" name="locale" defaultValue="en" className="mt-1">
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </Select>
                </div>
                <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save changes"}</Button>
              </form>
            </CardContent>
          </Card>
          <Card className="border-red-500/20">
            <CardHeader><CardTitle className="text-red-400">Danger zone</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-slate-400 mb-4">Request deletion of your account and associated data.</p>
              <Button variant="destructive" onClick={requestDeletion}>Request data deletion</Button>
            </CardContent>
          </Card>
        </div>
      </DashboardShell>
    </div>
  );
}
