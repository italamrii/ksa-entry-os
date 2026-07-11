"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { DashboardShell } from "@/components/layout/dashboard-nav";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/input";
import { toast } from "sonner";

interface Sector {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  isActive: boolean;
}

export default function AdminSectorsPage() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [form, setForm] = useState({ slug: "", nameEn: "", nameAr: "" });

  useEffect(() => {
    fetch("/api/admin/sectors").then((r) => r.json()).then(setSectors).catch(() => {});
  }, []);

  async function addSector(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/sectors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, isActive: true }),
    });
    if (!res.ok) { toast.error("Failed"); return; }
    const sector = await res.json();
    setSectors([...sectors, sector]);
    setForm({ slug: "", nameEn: "", nameAr: "" });
    toast.success("Sector added");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader isAuthenticated isAdmin />
      <DashboardShell locale="en" isAdmin currentPath="/admin">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Sectors</h1>
            <Link href="/admin"><Button variant="ghost" size="sm">Back</Button></Link>
          </div>

          <Card>
            <CardHeader><CardTitle>Add Sector</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={addSector} className="grid gap-3 sm:grid-cols-3">
                <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required className="mt-1" /></div>
                <div><Label>Name (EN)</Label><Input value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} required className="mt-1" /></div>
                <div><Label>Name (AR)</Label><Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} required className="mt-1" /></div>
                <Button type="submit">Add sector</Button>
              </form>
            </CardContent>
          </Card>

          {sectors.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-white">{s.nameEn}</p>
                  <p className="text-sm text-slate-400">{s.nameAr}</p>
                </div>
                <Badge variant={s.isActive ? "success" : "default"}>{s.slug}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardShell>
    </div>
  );
}
