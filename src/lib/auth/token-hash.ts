import { createHash, randomBytes } from "crypto";

/** SHA-256 hex digest of a raw session token. Never store the raw token. */
export function hashSessionToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

/** Cryptographically random session token (sent only in HttpOnly cookie JWT). */
export function generateRawSessionToken(): string {
  return randomBytes(32).toString("hex");
}
