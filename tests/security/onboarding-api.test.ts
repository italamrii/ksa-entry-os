import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

// --- Mock the route's dependencies (matches the repo's route-handler test style) ---
vi.mock("@/lib/auth", () => ({
  requireUser: vi.fn(),
  authErrorResponse: (err: unknown) => {
    const status =
      typeof err === "object" && err && "status" in err
        ? Number((err as { status: number }).status)
        : 500;
    const body =
      status === 401 ? "Unauthorized" : status === 403 ? "Forbidden" : "Request failed";
    return Response.json({ error: body }, { status });
  },
}));

vi.mock("@/lib/prisma", () => ({ prisma: { user: { update: vi.fn() } } }));
vi.mock("@/lib/audit", () => ({ createAuditLog: vi.fn() }));
vi.mock("@/lib/log", () => ({ logServerError: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  rateLimitAsync: vi.fn(async () => ({
    success: true,
    remaining: 1,
    resetAt: Date.now() + 1000,
    retryAfterSeconds: 1,
  })),
  getClientIp: () => "127.0.0.1",
  rateLimitResponse: () =>
    Response.json({ error: "Too many requests" }, { status: 429 }),
}));

import { POST } from "@/app/api/onboarding/route";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";
import { logServerError } from "@/lib/log";
import { rateLimitAsync } from "@/lib/rate-limit";

const mockRequireUser = vi.mocked(requireUser);
const mockUpdate = vi.mocked(prisma.user.update);
const mockAudit = vi.mocked(createAuditLog);
const mockLog = vi.mocked(logServerError);
const mockRateLimit = vi.mocked(rateLimitAsync);

const AUTH_USER = {
  id: "user-1",
  name: "Test",
  email: "t@example.com",
  role: "USER" as const,
  companyName: null,
  country: null,
  sectorId: null,
  companyType: null,
  entryGoal: null,
  locale: "en",
  onboardingDone: false,
};

const VALID = {
  companyName: "sssss",
  country: "china",
  companyType: "foreign",
  entryGoal: "setup",
  locale: "en",
};

function makeRequest(body: unknown, raw?: string): NextRequest {
  return new Request("http://localhost/api/onboarding", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: raw !== undefined ? raw : JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireUser.mockResolvedValue(AUTH_USER);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUpdate.mockResolvedValue({} as any);
  mockAudit.mockResolvedValue(undefined);
  mockRateLimit.mockResolvedValue({
    success: true,
    remaining: 1,
    resetAt: Date.now() + 1000,
    retryAfterSeconds: 1,
  });
});

describe("POST /api/onboarding", () => {
  it("persists the authenticated user's profile with onboardingDone=true and returns 200", async () => {
    const res = await POST(makeRequest(VALID));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const arg = mockUpdate.mock.calls[0][0];
    // Only the authenticated user's own row may be written.
    expect(arg.where).toEqual({ id: "user-1" });
    expect(arg.data).toMatchObject({
      companyName: "sssss",
      country: "china",
      companyType: "foreign",
      entryGoal: "setup",
      locale: "en",
      onboardingDone: true,
    });
    expect(mockAudit).toHaveBeenCalledTimes(1);
  });

  it("returns 401 when unauthenticated and never writes", async () => {
    mockRequireUser.mockRejectedValue(
      Object.assign(new Error("Unauthorized"), { status: 401 })
    );
    const res = await POST(makeRequest(VALID));
    expect(res.status).toBe(401);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid payload", async () => {
    const res = await POST(makeRequest({ companyName: "x" }));
    expect(res.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 for a malformed JSON body", async () => {
    const res = await POST(makeRequest(undefined, "not-json"));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/invalid request body/i);
  });

  it("rejects unknown fields (strict schema) with 400", async () => {
    const res = await POST(makeRequest({ ...VALID, evil: "x" }));
    expect(res.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    mockRateLimit.mockResolvedValue({
      success: false,
      remaining: 0,
      resetAt: Date.now() + 1000,
      retryAfterSeconds: 1,
    });
    const res = await POST(makeRequest(VALID));
    expect(res.status).toBe(429);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns a logged 500 on a genuine persistence failure (no audit, no throw)", async () => {
    mockUpdate.mockRejectedValue(new Error("db unreachable"));
    const res = await POST(makeRequest(VALID));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBe("Request failed");
    expect(mockLog).toHaveBeenCalledWith("onboarding", expect.any(Error));
    // Secondary work must not run when the write failed.
    expect(mockAudit).not.toHaveBeenCalled();
  });

  it("still returns 200 when audit logging fails (non-fatal)", async () => {
    mockAudit.mockRejectedValue(new Error("audit sink down"));
    const res = await POST(makeRequest(VALID));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });
});
