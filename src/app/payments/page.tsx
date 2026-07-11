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
  const [disabledMsg, setDisabledMsg] = useState<string | null>(null);

  const pricing = PRICING[plan];

  async function checkout() {
    setLoading(true);
    setDisabledMsg(null);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          ...(assessmentId ? { assessmentId } : {}),
        }),
      });
      const json = await res.json();
      if (res.status === 503 || json.code === "PAYMENTS_DISABLED") {
        setDisabledMsg("Payments not yet enabled. No charge was made.");
        toast.error("Payments not yet enabled");
        return;
      }
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
        <CardDescription>Select a plan. Amount and currency are set by the server.</CardDescription>
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
              <p className="text-emerald-400">
                {PRICING[p].price} {PRICING[p].currency}
              </p>
            </button>
          ))}
        </div>
        <DisclaimerBanner />
        <p className="text-xs text-slate-500">{DISCLAIMER_EN}</p>
        {disabledMsg && (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            {disabledMsg}
          </p>
        )}
        <Button className="w-full" onClick={checkout} disabled={loading}>
          {loading ? "Processing..." : `Continue · ${pricing.price} ${pricing.currency}`}
        </Button>
        <p className="text-center text-xs text-slate-500">
          Payment completion requires a verified provider webhook or an authorized admin action.
          No card data is collected on this page.
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
