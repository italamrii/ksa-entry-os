"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SiteHeader, DisclaimerBanner } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PRICING, DISCLAIMER_EN } from "@/lib/constants";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("assessment");
  const planParam = searchParams.get("plan") as "PROFESSIONAL" | "BUSINESS" | null;
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<"PROFESSIONAL" | "BUSINESS">(planParam ?? "PROFESSIONAL");

  const pricing = PRICING[plan];

  async function checkout() {
    setLoading(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, assessmentId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Checkout failed");
        return;
      }
      router.push(`/payments/${json.paymentId}`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-emerald-400" />
          Checkout
        </CardTitle>
        <CardDescription>Select a plan and complete payment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {(["PROFESSIONAL", "BUSINESS"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlan(p)}
              className={`w-full rounded-lg border p-4 text-left transition ${
                plan === p ? "border-emerald-500 bg-emerald-500/10" : "border-slate-700"
              }`}
            >
              <p className="font-medium text-white">{PRICING[p].name}</p>
              <p className="text-emerald-400">{PRICING[p].price} {PRICING[p].currency}</p>
            </button>
          ))}
        </div>
        <DisclaimerBanner />
        <p className="text-xs text-slate-500">{DISCLAIMER_EN}</p>
        <Button className="w-full" onClick={checkout} disabled={loading}>
          {loading ? "Processing..." : `Pay ${pricing.price} ${pricing.currency}`}
        </Button>
        <p className="text-center text-xs text-slate-500">
          Demo mode — no real card data is collected or stored.
        </p>
      </CardContent>
    </Card>
  );
}

export default function PaymentsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader isAuthenticated />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Suspense fallback={<div className="text-slate-400">Loading...</div>}>
          <CheckoutContent />
        </Suspense>
      </div>
    </div>
  );
}
