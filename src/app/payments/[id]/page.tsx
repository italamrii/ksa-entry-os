"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader, DisclaimerBanner } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

interface PaymentView {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  invoiceNumber: string;
  allowDemoPayments: boolean;
  providerConfigured: boolean;
  paymentsEnabled: boolean;
}

export default function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [payment, setPayment] = useState<PaymentView | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    params.then(async (p) => {
      try {
        const res = await fetch(`/api/payments/${p.id}`, { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setLoadError(true);
          return;
        }
        const json = (await res.json()) as PaymentView;
        if (!cancelled) setPayment(json);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [params]);

  async function simulatePayment(success: boolean) {
    if (!payment?.allowDemoPayments) return;
    setLoading(true);
    try {
      const res = await fetch("/api/payments/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId: payment.id,
          outcome: success ? "success" : "failure",
        }),
      });
      if (!res.ok) {
        toast.error("Demo payment rejected");
        return;
      }
      const json = (await res.json()) as { status: PaymentStatus };
      setPayment((prev) => (prev ? { ...prev, status: json.status } : prev));
      toast.success(success ? "Demo payment marked paid (dev only)" : "Demo payment marked failed");
      if (success) setTimeout(() => router.push("/dashboard"), 1500);
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
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
            <CardDescription>
              {payment
                ? `${payment.invoiceNumber} · ${payment.amount} ${payment.currency}`
                : loadError
                  ? "Unable to load payment"
                  : "Loading..."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {payment && (
              <div className="flex items-center justify-center">
                <Badge
                  variant={
                    payment.status === "PAID"
                      ? "success"
                      : payment.status === "FAILED"
                        ? "danger"
                        : "warning"
                  }
                >
                  {payment.status}
                </Badge>
              </div>
            )}

            {payment?.status === "PENDING" && !payment.providerConfigured && !payment.allowDemoPayments && (
              <div className="space-y-3 text-center">
                <p className="text-sm text-slate-300">Payments not yet enabled</p>
                <p className="text-xs text-slate-500">
                  Card checkout is not configured. No payment was processed. Contact support or try again
                  when online payments are available.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard">Return to dashboard</Link>
                </Button>
              </div>
            )}

            {payment?.status === "PENDING" && payment.allowDemoPayments && (
              <>
                <p className="text-center text-sm text-amber-200/90">
                  Development demo only — not a real payment. Disabled in production.
                </p>
                <Button
                  className="w-full"
                  onClick={() => simulatePayment(true)}
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Simulate successful payment (dev)"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => simulatePayment(false)}
                  disabled={loading}
                >
                  Simulate failed payment (dev)
                </Button>
              </>
            )}

            {payment?.status === "PENDING" && payment.providerConfigured && (
              <p className="text-center text-sm text-slate-400">
                Complete checkout with the payment provider. Status updates after verified webhook
                confirmation.
              </p>
            )}

            {payment?.status === "PAID" && (
              <div className="text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
                <p className="mt-2 text-white">Payment confirmed</p>
              </div>
            )}
            <DisclaimerBanner />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
