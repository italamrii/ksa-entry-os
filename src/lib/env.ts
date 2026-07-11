import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PAYMENT_PROVIDER_KEY: z.string().optional(),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),
});

function validateEnv() {
  const parsed = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
    PAYMENT_PROVIDER_KEY: process.env.PAYMENT_PROVIDER_KEY,
    PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET,
  });

  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    if (process.env.NODE_ENV === "production") {
      throw new Error(`Missing or invalid environment variables: ${missing}`);
    }
    console.warn(`[env] Warning: ${missing}`);
  }

  // Always surface a clear warning when DATABASE_URL is empty (common Railway misconfig)
  if (!process.env.DATABASE_URL?.trim()) {
    console.error(
      "[env] DATABASE_URL is empty. Registration and all Prisma queries will fail until it is set."
    );
  }

  return parsed.success
    ? parsed.data
    : {
        DATABASE_URL: process.env.DATABASE_URL ?? "",
        AUTH_SECRET: process.env.AUTH_SECRET ?? "dev-secret-min-32-characters-long!!",
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        NODE_ENV: (process.env.NODE_ENV as "development" | "production" | "test") ?? "development",
        PAYMENT_PROVIDER_KEY: process.env.PAYMENT_PROVIDER_KEY,
        PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET,
      };
}

export const env = validateEnv();
