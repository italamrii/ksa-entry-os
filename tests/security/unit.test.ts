import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createHash } from "crypto";
import {
  generateRawSessionToken,
  hashSessionToken,
} from "@/lib/auth/token-hash";
import {
  rateLimit,
  rateLimitAsync,
  __resetMemoryRateLimitForTests,
  normalizeEmailKey,
} from "@/lib/rate-limit";
import {
  isDemoPaymentsAllowed,
  paymentsFeatureFlags,
  demoPaymentSchema,
} from "@/lib/payments/flags";
import { assertResourceOwner } from "@/lib/auth";
import {
  normalizeEmail,
  loginSchema,
  registerSchema,
  assessmentSchema,
} from "@/lib/validation/schemas";
import { createSessionToken, verifySessionToken } from "@/lib/auth/jwt";

describe("session token hashing", () => {
  it("hashes with SHA-256 hex", () => {
    const raw = "abc123";
    expect(hashSessionToken(raw)).toBe(
      createHash("sha256").update(raw, "utf8").digest("hex")
    );
  });

  it("generates high-entropy raw tokens", () => {
    const a = generateRawSessionToken();
    const b = generateRawSessionToken();
    expect(a).toHaveLength(64);
    expect(a).not.toBe(b);
    expect(hashSessionToken(a)).not.toBe(a);
  });

  it("raw DB hash cannot verify as JWT sessionId alone without cookie JWT", async () => {
    process.env.AUTH_SECRET = "test-secret-min-32-characters-long!!";
    const raw = generateRawSessionToken();
    const hash = hashSessionToken(raw);
    const jwt = await createSessionToken({
      userId: "u1",
      email: "a@b.com",
      role: "USER",
      sessionId: raw,
    });
    const payload = await verifySessionToken(jwt);
    expect(payload?.sessionId).toBe(raw);
    expect(payload?.sessionId).not.toBe(hash);
    const forged = await createSessionToken({
      userId: "u1",
      email: "a@b.com",
      role: "USER",
      sessionId: hash,
    });
    const forgedPayload = await verifySessionToken(forged);
    expect(forgedPayload?.sessionId).toBe(hash);
    expect(hashSessionToken(forgedPayload!.sessionId)).not.toBe(hash);
  });
});

describe("authorization helpers", () => {
  it("assertResourceOwner throws 404 on mismatch", () => {
    try {
      assertResourceOwner("user-a", "user-b");
      expect.fail("should throw");
    } catch (err) {
      expect((err as Error & { status: number }).status).toBe(404);
    }
  });

  it("assertResourceOwner allows owner", () => {
    expect(() => assertResourceOwner("user-a", "user-a")).not.toThrow();
  });
});

describe("demo payment flags", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects demo payments in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOW_DEMO_PAYMENTS", "true");
    expect(isDemoPaymentsAllowed()).toBe(false);
    expect(paymentsFeatureFlags().allowDemoPayments).toBe(false);
  });

  it("allows demo only when not production and flag true", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ALLOW_DEMO_PAYMENTS", "true");
    expect(isDemoPaymentsAllowed()).toBe(true);
  });

  it("disables demo when flag false", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("ALLOW_DEMO_PAYMENTS", "false");
    expect(isDemoPaymentsAllowed()).toBe(false);
  });
});

describe("rate limiting", () => {
  beforeEach(() => {
    delete process.env.REDIS_URL;
    __resetMemoryRateLimitForTests();
  });

  it("returns 429 after limit (sync memory)", () => {
    const key = `test:${Date.now()}`;
    expect(rateLimit(key, 2, 60_000).success).toBe(true);
    expect(rateLimit(key, 2, 60_000).success).toBe(true);
    const blocked = rateLimit(key, 2, 60_000);
    expect(blocked.success).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("async memory path works in non-production", async () => {
    const key = `async:${Date.now()}`;
    expect((await rateLimitAsync(key, 1, 60_000)).success).toBe(true);
    expect((await rateLimitAsync(key, 1, 60_000)).success).toBe(false);
  });

  it("normalizes email keys", () => {
    expect(normalizeEmailKey("  Foo@Bar.COM ")).toBe("foo@bar.com");
  });
});

describe("input validation", () => {
  it("normalizes emails", () => {
    expect(normalizeEmail("  Admin@Example.COM ")).toBe("admin@example.com");
  });

  it("rejects unknown enum values", () => {
    expect(
      assessmentSchema.safeParse({
        companyOrigin: "mars",
        hasForeignEntity: false,
        hiringEmployees: false,
        sellingToGov: false,
        needsLocalOffice: false,
        invoiceCustomers: false,
        sectorLicensing: false,
      }).success
    ).toBe(false);
  });

  it("rejects malformed login payloads", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(
      false
    );
  });

  it("rejects unknown fields when strict", () => {
    expect(
      registerSchema.strict().safeParse({
        name: "Test User",
        email: "t@example.com",
        password: "TestPass1",
        companyName: "Co",
        country: "SA",
        companyType: "foreign",
        entryGoal: "explore",
        unexpected: true,
      }).success
    ).toBe(false);
  });

  it("rejects invalid IDs for optional cuid fields", () => {
    expect(
      demoPaymentSchema.safeParse({ paymentId: "not-a-cuid", outcome: "success" }).success
    ).toBe(false);
  });
});
