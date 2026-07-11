import { z } from "zod";

/**
 * Feature flags for demo-only behavior.
 * Demo payment mutation must never work when NODE_ENV=production.
 */
export function paymentsFeatureFlags() {
  const isProduction = process.env.NODE_ENV === "production";
  const allowDemo =
    !isProduction && process.env.ALLOW_DEMO_PAYMENTS === "true";
  const providerConfigured = Boolean(
    process.env.PAYMENT_PROVIDER_KEY?.trim() &&
      process.env.PAYMENT_WEBHOOK_SECRET?.trim()
  );

  return {
    isProduction,
    allowDemoPayments: allowDemo,
    providerConfigured,
    paymentsEnabled: providerConfigured || allowDemo,
  };
}

export function isDemoPaymentsAllowed(): boolean {
  return paymentsFeatureFlags().allowDemoPayments;
}

export const demoPaymentSchema = z
  .object({
    paymentId: z.string().cuid(),
    outcome: z.enum(["success", "failure"]),
  })
  .strict();

export const adminPaymentStatusSchema = z
  .object({
    paymentId: z.string().cuid(),
    status: z.enum(["PAID", "FAILED", "REFUNDED", "PENDING"]),
    reason: z.string().trim().min(3).max(500),
  })
  .strict();

export const webhookPaymentSchema = z
  .object({
    eventId: z.string().min(8).max(200),
    paymentId: z.string().cuid(),
    status: z.enum(["PAID", "FAILED", "REFUNDED"]),
  })
  .strict();
