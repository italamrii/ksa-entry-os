export async function register() {
  // Fail fast on production misconfiguration (imported for side-effect validation)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("@/lib/env");
  }
}
