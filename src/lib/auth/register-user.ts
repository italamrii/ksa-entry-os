import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { provisionPersonalOrganization } from "@/lib/organizations";
import { normalizeEmail, type RegisterInput } from "@/lib/validation/schemas";

export type RegisterResult =
  | { ok: true; userId: string; email: string; role: "USER" | "ADMIN" }
  | {
      ok: false;
      code: "DUPLICATE_EMAIL" | "INVALID_SECTOR" | "DATABASE" | "HASH" | "UNKNOWN";
      message: string;
    };

/**
 * Persist a new user to PostgreSQL.
 * Password is hashed with Argon2id — never stored in plain text.
 */
export async function registerUser(data: RegisterInput): Promise<RegisterResult> {
  const email = normalizeEmail(data.email);
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl || databaseUrl.trim() === "") {
    console.error("[register] DATABASE_URL is missing or empty");
    return {
      ok: false,
      code: "DATABASE",
      message: "Registration is temporarily unavailable.",
    };
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return {
        ok: false,
        code: "DUPLICATE_EMAIL",
        message: "Registration failed. Please try a different email.",
      };
    }

    let sectorId: string | null = null;
    if (data.sectorId) {
      const sector = await prisma.sector.findUnique({
        where: { id: data.sectorId },
        select: { id: true },
      });
      if (!sector) {
        return {
          ok: false,
          code: "INVALID_SECTOR",
          message: "Invalid sector selected. Please choose again.",
        };
      }
      sectorId = sector.id;
    }

    let passwordHash: string;
    try {
      passwordHash = await hashPassword(data.password);
    } catch (err) {
      console.error("[register] password hashing failed", {
        name: err instanceof Error ? err.name : "Error",
        message: err instanceof Error ? err.message : "unknown",
      });
      return {
        ok: false,
        code: "HASH",
        message: "Registration is temporarily unavailable.",
      };
    }

    // Create the user and provision their personal organization (OWNER
    // membership + company profile) atomically, so no user can exist without
    // an organization.
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: data.name.trim(),
          email,
          passwordHash,
          companyName: data.companyName.trim(),
          country: data.country.trim(),
          sectorId,
          companyType: data.companyType.trim(),
          entryGoal: data.entryGoal.trim(),
          role: "USER",
          onboardingDone: false,
          locale: "en",
        },
        select: {
          id: true,
          email: true,
          role: true,
        },
      });

      await provisionPersonalOrganization(tx, {
        userId: created.id,
        name: data.companyName.trim() || data.name.trim(),
        profile: {
          companyName: data.companyName.trim(),
          originCountry: data.country.trim(),
          companyType: data.companyType.trim(),
          sectorId,
          entryGoal: data.entryGoal.trim(),
          locale: "en",
          onboardingDone: false,
        },
      });

      return created;
    });

    console.info("[register] user created", { userId: user.id, email: user.email });

    return {
      ok: true,
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        return {
          ok: false,
          code: "DUPLICATE_EMAIL",
          message: "Registration failed. Please try a different email.",
        };
      }
      if (err.code === "P2003") {
        return {
          ok: false,
          code: "INVALID_SECTOR",
          message: "Invalid sector selected. Please choose again.",
        };
      }
      console.error("[register] prisma error", {
        code: err.code,
        meta: err.meta,
      });
      return {
        ok: false,
        code: "DATABASE",
        message: "Registration is temporarily unavailable.",
      };
    }

    const name = err instanceof Error ? err.name : "";
    const message = err instanceof Error ? err.message : "";
    if (
      name === "PrismaClientInitializationError" ||
      message.includes("Authentication failed") ||
      message.includes("Can't reach database") ||
      message.includes("P1000") ||
      message.includes("P1001")
    ) {
      console.error("[register] database unreachable", { name, message });
      return {
        ok: false,
        code: "DATABASE",
        message: "Registration is temporarily unavailable.",
      };
    }

    console.error("[register] unexpected failure", { name, message });
    return {
      ok: false,
      code: "UNKNOWN",
      message: "Registration failed",
    };
  }
}
