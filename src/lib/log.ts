import { Prisma } from "@prisma/client";

/**
 * Log an internal error to the server console with enough detail to diagnose a
 * genuine failure (Prisma error code, error name, message), WITHOUT ever leaking
 * secrets, tokens, hashes, DATABASE_URL, or stack traces to clients.
 *
 * Callers must still return a generic body (e.g. `{ error: "Request failed" }`)
 * to the client — this only writes to the server log.
 */
export function logServerError(scope: string, err: unknown): void {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // e.g. P2002 (unique), P2003 (FK), P2022 (missing column)
    console.error(`[${scope}] prisma known error`, { code: err.code, message: err.message });
    return;
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    // e.g. database unreachable / auth failed. Prisma's message never contains
    // the connection password, only host:port, so it is safe for server logs.
    console.error(`[${scope}] prisma init error`, {
      errorCode: err.errorCode,
      message: err.message,
    });
    return;
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    console.error(`[${scope}] prisma validation error`, { message: err.message });
    return;
  }
  if (err instanceof Error) {
    console.error(`[${scope}] error`, { name: err.name, message: err.message });
    return;
  }
  console.error(`[${scope}] non-error thrown`, { value: String(err) });
}
