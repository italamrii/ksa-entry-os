"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader, DisclaimerBanner } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/input";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export default function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [paymentId, setPaymentId] = useState<string>("");
  const [status, setStatus] = useState<"PENDING" | "PAID" | "FAILED">("PENDING");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    params.then((p) => setPaymentId(p.id));
  }, [params]);

  async function simulatePayment(paid: boolean) {
    if (!paymentId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, status: paid ? "PAID" : "FAILED" }),
      });
      if (!res.ok) {
        toast.error("Payment update failed");
        return;
      }
      setStatus(paid ? "PAID" : "FAILED");
      toast.success(paid ? "Payment successful!" : "Payment failed");
      if (paid) setTimeout(() => router.push("/dashboard"), 2000);
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
            <CardDescription>{paymentId ? `Payment: ${paymentId.slice(0, 8)}...` : "Loading..."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              <Badge variant={status === "PAID" ? "success" : status === "FAILED" ? "danger" : "warning"}>
                {status}
              </Badge>
            </div>
            {status === "PENDING" && (
              <>
                <p className="text-center text-sm text-slate-400">
                  Demo payment — no card data collected. Click to simulate.
                </p>
                <Button className="w-full" onClick={() => simulatePayment(true)} disabled={loading || !paymentId}>
                  {loading ? "Processing..." : "Simulate successful payment"}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => simulatePayment(false)} disabled={loading || !paymentId}>
                  Simulate failed payment
                </Button>
              </>
            )}
            {status === "PAID" && (
              <div className="text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
                <p className="mt-2 text-white">Payment confirmed!</p>
              </div>
            )}
            <DisclaimerBanner />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
