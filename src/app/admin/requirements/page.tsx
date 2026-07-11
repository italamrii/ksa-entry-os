"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { DashboardShell } from "@/components/layout/dashboard-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/input";

interface Requirement {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  complexity: string;
  riskLevel: string;
  ruleKey: string | null;
  order: number;
  isActive: boolean;
}

export default function AdminRequirementsPage() {
  const [requirements, setRequirements] = useState<Requirement[]>([]);

  useEffect(() => {
    fetch("/api/admin/requirements").then((r) => r.json()).then(setRequirements).catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader isAuthenticated isAdmin />
      <DashboardShell locale="en" isAdmin currentPath="/admin">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">Requirements</h1>
            <Link href="/admin"><Button variant="ghost" size="sm">Back</Button></Link>
          </div>

          {requirements.map((req) => (
            <Card key={req.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle className="text-base">{req.titleEn}</CardTitle>
                  <p className="text-sm text-slate-400">{req.titleAr}</p>
                </div>
                <div className="flex gap-1">
                  <Badge>{req.complexity}</Badge>
                  <Badge variant={req.riskLevel === "HIGH" ? "danger" : "warning"}>{req.riskLevel}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">Rule: {req.ruleKey} | Order: {req.order}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardShell>
    </div>
  );
}
