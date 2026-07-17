"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { toast } from "sonner";

type Plan = "FREE" | "PROFESSIONAL" | "BUSINESS";

/**
 * Admin-only subscription controls for one user row. Server enforces
 * authorization and resolves the organization — these controls only express
 * intent, and every action is confirmed before it is sent.
 */
export function SubscriptionControls({
  targetUserId,
  userLabel,
  currentPlan,
  currentStatus,
}: {
  targetUserId: string;
  userLabel: string;
  currentPlan: string | null;
  currentStatus: string | null;
}) {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>("PROFESSIONAL");
  const [busy, setBusy] = useState(false);

  async function act(action: "grant" | "cancel" | "expire", confirmText: string, payload?: Record<string, unknown>) {
    if (!confirm(confirmText)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, action, ...payload }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Subscription update failed");
        return;
      }
      toast.success(
        json.subscription
          ? `Subscription: ${json.subscription.plan} (${json.subscription.status})`
          : "Subscription updated"
      );
      router.refresh();
    } catch {
      toast.error("Subscription update failed");
    } finally {
      setBusy(false);
    }
  }

  const hasActive = currentStatus === "ACTIVE";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        aria-label={`Plan for ${userLabel}`}
        value={plan}
        onChange={(e) => setPlan(e.target.value as Plan)}
        disabled={busy}
        className="h-8 w-auto py-1 text-xs"
      >
        <option value="FREE">FREE</option>
        <option value="PROFESSIONAL">PROFESSIONAL</option>
        <option value="BUSINESS">BUSINESS</option>
      </Select>
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() =>
          act("grant", `Grant ${plan} to ${userLabel}'s organization? Any current active subscription will be superseded.`, { plan })
        }
      >
        Grant
      </Button>
      {hasActive && (
        <>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => act("cancel", `Cancel the active ${currentPlan} subscription for ${userLabel}?`)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => act("expire", `Mark the active ${currentPlan} subscription for ${userLabel} as expired?`)}
          >
            Expire
          </Button>
        </>
      )}
    </div>
  );
}
