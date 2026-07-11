import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  REDIS_URL: z.string().optional(),
  ALLOW_MEMORY_RATE_LIMIT: z.enum(["true", "false"]).optional(),
  ALLOW_DEMO_PAYMENTS: z.enum(["true", "false"]).optional(),
  PAYMENT_PROVIDER_KEY: z.string().optional(),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),
  SEED_ADMIN_EMAIL: z.string().optional(),
  SEED_ADMIN_PASSWORD: z.string().optional(),
});

const INSECURE_DEFAULTS = new Set([
  "ChangeMe123!Secure",
  "change-me-to-a-secure-random-string-min-32-chars",
  "dev-secret-min-32-characters-long!!",
]);

function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function validateEnv() {
  const parsed = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
    REDIS_URL: process.env.REDIS_URL,
    ALLOW_MEMORY_RATE_LIMIT: process.env.ALLOW_MEMORY_RATE_LIMIT,
    ALLOW_DEMO_PAYMENTS: process.env.ALLOW_DEMO_PAYMENTS,
    PAYMENT_PROVIDER_KEY: process.env.PAYMENT_PROVIDER_KEY,
    PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET,
    SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL,
    SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD,
  });

  const isProduction = process.env.NODE_ENV === "production";
  const enforceRuntime = isProduction && !isBuildPhase();

  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    if (enforceRuntime) {
      throw new Error(`Missing or invalid environment variables: ${missing}`);
    }
    console.warn(`[env] Warning: ${missing}`);
  }

  if (!process.env.DATABASE_URL?.trim()) {
    console.error(
      "[env] DATABASE_URL is empty. Registration and all Prisma queries will fail until it is set."
    );
  }

  if (enforceRuntime) {
    const secret = process.env.AUTH_SECRET ?? "";
    if (secret.length < 32 || INSECURE_DEFAULTS.has(secret)) {
      throw new Error(
        "AUTH_SECRET must be a strong random value (>=32 chars) in production"
      );
    }
    if (process.env.ALLOW_DEMO_PAYMENTS === "true") {
      throw new Error("ALLOW_DEMO_PAYMENTS must not be true in production");
    }
    if (
      process.env.SEED_ADMIN_PASSWORD &&
      INSECURE_DEFAULTS.has(process.env.SEED_ADMIN_PASSWORD)
    ) {
      throw new Error(
        "SEED_ADMIN_PASSWORD must not use the insecure default in production"
      );
    }
    if (!process.env.REDIS_URL?.trim() && process.env.ALLOW_MEMORY_RATE_LIMIT !== "true") {
      throw new Error(
        "REDIS_URL is required in production (or set ALLOW_MEMORY_RATE_LIMIT=true explicitly)"
      );
    }
  }

  return parsed.success
    ? parsed.data
    : {
        DATABASE_URL: process.env.DATABASE_URL ?? "",
        AUTH_SECRET: process.env.AUTH_SECRET ?? "dev-secret-min-32-characters-long!!",
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
        NODE_ENV: (process.env.NODE_ENV as "development" | "production" | "test") ?? "development",
        REDIS_URL: process.env.REDIS_URL,
        ALLOW_MEMORY_RATE_LIMIT: process.env.ALLOW_MEMORY_RATE_LIMIT as
          | "true"
          | "false"
          | undefined,
        ALLOW_DEMO_PAYMENTS: process.env.ALLOW_DEMO_PAYMENTS as "true" | "false" | undefined,
        PAYMENT_PROVIDER_KEY: process.env.PAYMENT_PROVIDER_KEY,
        PAYMENT_WEBHOOK_SECRET: process.env.PAYMENT_WEBHOOK_SECRET,
        SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL,
        SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD,
      };
}

export const env = validateEnv();
