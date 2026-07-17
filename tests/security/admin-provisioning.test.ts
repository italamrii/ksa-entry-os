/**
 * Admin provisioning decision logic (pure — no database).
 * The DB-backed provisioning/rotation/subscription flow lives in
 * scripts/test-admin.ts (npm run test:admin).
 */
import { describe, it, expect } from "vitest";
import { adminProvisionDecision, DEFAULT_ADMIN_PASSWORD } from "../../prisma/seed-admin";
import { governanceRolesFor, hasGovernanceRole, actingRoleForTransition } from "@/lib/governance/capabilities";

const PROD = "production";
const STRONG = "Str0ngProdPassw0rd";

describe("adminProvisionDecision — production gates", () => {
  it("skips when SEED_ADMIN_EMAIL is missing", () => {
    const d = adminProvisionDecision({ nodeEnv: PROD, password: STRONG });
    expect(d.provision).toBe(false);
    if (!d.provision) expect(d.reason).toMatch(/EMAIL/);
  });

  it("skips when SEED_ADMIN_PASSWORD is missing", () => {
    const d = adminProvisionDecision({ nodeEnv: PROD, email: "ops@example.com" });
    expect(d.provision).toBe(false);
    if (!d.provision) expect(d.reason).toMatch(/PASSWORD missing/);
  });

  it("rejects the default placeholder password", () => {
    const d = adminProvisionDecision({ nodeEnv: PROD, email: "ops@example.com", password: DEFAULT_ADMIN_PASSWORD });
    expect(d.provision).toBe(false);
    if (!d.provision) expect(d.reason).toMatch(/default/);
  });

  it("rejects weak passwords (short, no upper, no digit)", () => {
    for (const weak of ["short1A", "alllowercase1", "ALLUPPERCASE1", "NoDigitsHere"]) {
      const d = adminProvisionDecision({ nodeEnv: PROD, email: "ops@example.com", password: weak });
      expect(d.provision, weak).toBe(false);
    }
  });

  it("provisions with valid env, normalizing the email", () => {
    const d = adminProvisionDecision({
      nodeEnv: PROD,
      email: "  Ops@Example.COM ",
      password: STRONG,
      name: "KSA Ops",
    });
    expect(d.provision).toBe(true);
    if (d.provision) {
      expect(d.email).toBe("ops@example.com");
      expect(d.name).toBe("KSA Ops");
    }
  });

  it("defaults the name to Platform Admin", () => {
    const d = adminProvisionDecision({ nodeEnv: PROD, email: "ops@example.com", password: STRONG });
    if (d.provision) expect(d.name).toBe("Platform Admin");
  });

  it("development falls back to default credentials (never in production)", () => {
    const dev = adminProvisionDecision({ nodeEnv: "development" });
    expect(dev.provision).toBe(true);
  });
});

describe("governance capabilities from User.role", () => {
  it("platform ADMIN holds all five governance roles", () => {
    const roles = governanceRolesFor({ role: "ADMIN" });
    expect(roles).toEqual(["AUTHOR", "REVIEWER", "LEGAL_REVIEWER", "PUBLISHER", "ADMIN"]);
  });

  it("a normal USER holds no governance role", () => {
    expect(governanceRolesFor({ role: "USER" })).toEqual([]);
    expect(hasGovernanceRole({ role: "USER" }, "PUBLISHER")).toBe(false);
  });

  it("acting role reflects the true capacity per transition target", () => {
    expect(actingRoleForTransition({ role: "ADMIN" }, "PUBLISHED")).toBe("PUBLISHER");
    expect(actingRoleForTransition({ role: "ADMIN" }, "REVIEWED")).toBe("REVIEWER");
    expect(actingRoleForTransition({ role: "ADMIN" }, "LEGAL_FLAG_CHECK")).toBe("LEGAL_REVIEWER");
    expect(actingRoleForTransition({ role: "USER" }, "PUBLISHED")).toBeNull();
  });
});
