import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(),
  authErrorResponse: (err: unknown) => {
    const status =
      typeof err === "object" && err && "status" in err
        ? Number((err as { status: number }).status)
        : 500;
    return Response.json({ error: "err" }, { status });
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/audit", () => ({ createAuditLog: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  rateLimitAsync: vi.fn(async () => ({
    success: true,
    remaining: 1,
    resetAt: Date.now() + 1000,
    retryAfterSeconds: 1,
  })),
  getClientIp: () => "127.0.0.1",
  rateLimitResponse: () => Response.json({ error: "Too many requests" }, { status: 429 }),
}));

describe("payments API mutation surface", () => {
  it("PATCH /api/payments returns 405", async () => {
    const { PATCH } = await import("@/app/api/payments/route");
    const res = await PATCH();
    expect(res.status).toBe(405);
    const body = await res.json();
    expect(body.error).toMatch(/not allowed/i);
  });
});
