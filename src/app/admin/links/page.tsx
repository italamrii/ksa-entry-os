"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { DashboardShell } from "@/components/layout/dashboard-nav";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";

interface OfficialLink {
  id: string;
  titleEn: string;
  titleAr: string;
  url: string;
  isActive: boolean;
}

export default function AdminLinksPage() {
  const [links, setLinks] = useState<OfficialLink[]>([]);
  const [form, setForm] = useState({ titleEn: "", titleAr: "", url: "" });

  useEffect(() => {
    fetch("/api/admin/links").then((r) => r.json()).then(setLinks).catch(() => {});
  }, []);

  async function addLink(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, isActive: true }),
    });
    if (!res.ok) { toast.error("Failed"); return; }
    const link = await res.json();
    setLinks([link, ...links]);
    setForm({ titleEn: "", titleAr: "", url: "" });
    toast.success("Link added");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader isAuthenticated isAdmin />
      <DashboardShell locale="en" isAdmin currentPath="/admin">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Official Links</h1>
            <Link href="/admin"><Button variant="ghost" size="sm">Back</Button></Link>
          </div>

          <Card>
            <CardHeader><CardTitle>Add Link</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={addLink} className="grid gap-3 sm:grid-cols-2">
                <div><Label>Title (EN)</Label><Input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} required className="mt-1" /></div>
                <div><Label>Title (AR)</Label><Input value={form.titleAr} onChange={(e) => setForm({ ...form, titleAr: e.target.value })} required className="mt-1" /></div>
                <div className="sm:col-span-2"><Label>URL</Label><Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required type="url" className="mt-1" /></div>
                <Button type="submit">Add link</Button>
              </form>
            </CardContent>
          </Card>

          {links.map((link) => (
            <Card key={link.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-white">{link.titleEn}</p>
                  <p className="text-sm text-slate-400">{link.titleAr}</p>
                </div>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-emerald-400">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardShell>
    </div>
  );
}
