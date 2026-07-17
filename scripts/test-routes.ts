/**
 * Route smoke crawl (live dev/prod server + live DB).
 * Run: npm run test:routes   (server must be listening on BASE_URL)
 *
 * Crawls every page route in four states — anonymous EN, anonymous AR,
 * authenticated user, admin — asserting: expected status, bounded redirects
 * (never a loop), a real HTML body, and no Next.js error page. Regression net
 * for the production symptoms: blank pages, ERR_TOO_MANY_REDIRECTS, and stale
 * session cookies after a database recreation.
 */
import { prisma } from "../src/lib/prisma";
import { createUserSession } from "../src/lib/auth";
import { SESSION_COOKIE } from "../src/lib/auth/jwt";
import { registerUser } from "../src/lib/auth/register-user";
import { normalizeEmail } from "../src/lib/validation/schemas";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

let failures = 0;
function fail(msg: string) {
  console.error("FAIL:", msg);
  failures++;
}
function ok(msg: string) {
  console.log("OK:", msg);
}

interface CrawlExpect {
  /** Final path prefix after redirects (null = must not redirect at all). */
  landsOn?: string;
  maxRedirects?: number;
}

// NOTE: App Router embeds the not-found boundary template in every page's
// HTML, so "This page could not be found" is NOT a usable marker — a genuine
// 404 surfaces through the HTTP status check instead.
const ERROR_MARKERS = [
  "Application error: a server-side exception",
  "Application error: a client-side exception",
];

async function crawl(path: string, cookie: string | null, expect: CrawlExpect, label: string) {
  let url = new URL(path, BASE).toString();
  let redirects = 0;
  const max = expect.maxRedirects ?? 5;
  let res: Response;
  for (;;) {
    res = await fetch(url, {
      redirect: "manual",
      headers: cookie ? { cookie } : {},
    });
    if (res.status >= 300 && res.status < 400) {
      redirects++;
      if (redirects > max) {
        fail(`${label} ${path}: redirect loop (> ${max} hops), last → ${res.headers.get("location")}`);
        return;
      }
      url = new URL(res.headers.get("location")!, url).toString();
      continue;
    }
    break;
  }
  const finalPath = new URL(url).pathname;
  if (res.status !== 200) {
    fail(`${label} ${path}: status ${res.status} at ${finalPath}`);
    return;
  }
  if (expect.landsOn && !finalPath.startsWith(expect.landsOn)) {
    fail(`${label} ${path}: landed on ${finalPath}, expected ${expect.landsOn}`);
    return;
  }
  if (!expect.landsOn && redirects > 0) {
    fail(`${label} ${path}: unexpected redirect to ${finalPath}`);
    return;
  }
  const body = await res.text();
  if (body.length < 500) {
    fail(`${label} ${path}: suspiciously small body (${body.length} bytes) — blank page?`);
    return;
  }
  for (const marker of ERROR_MARKERS) {
    if (body.includes(marker)) {
      fail(`${label} ${path}: error marker "${marker}"`);
      return;
    }
  }
  ok(`${label} ${path}${redirects ? ` (→ ${finalPath}, ${redirects} hop)` : ""}`);
}

async function main() {
  // Server must be up.
  try {
    await fetch(BASE, { redirect: "manual" });
  } catch {
    console.error(`Server not reachable at ${BASE} — start it first (npm run dev).`);
    process.exit(1);
  }

  const stamp = Date.now();

  // Authenticated (onboarded) user with a real DB-backed session.
  const reg = await registerUser({
    name: "Route Smoke",
    email: normalizeEmail(`routesmoke+${stamp}@example.com`),
    password: "RouteSmoke123",
    companyName: "Smoke Co",
    country: "SA",
    companyType: "foreign",
    entryGoal: "setup",
  });
  if (!reg.ok) {
    console.error("registration failed");
    process.exit(1);
  }
  await prisma.user.update({ where: { id: reg.userId }, data: { onboardingDone: true } });
  const userJwt = await createUserSession(reg.userId, `routesmoke+${stamp}@example.com`, "USER");
  const userCookie = `${SESSION_COOKIE}=${userJwt}`;

  // Admin session (against the seeded admin), if present.
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" }, select: { id: true, email: true } });
  const adminCookie = admin
    ? `${SESSION_COOKIE}=${await createUserSession(admin.id, admin.email, "ADMIN")}`
    : null;

  const publicRoutes = ["/", "/pricing", "/legal/disclaimer", "/legal/privacy", "/legal/terms", "/legal/data-deletion", "/login", "/register"];
  const protectedRoutes = ["/dashboard", "/workspace", "/assessment/new", "/requests", "/payments", "/payments/list", "/settings"];
  const adminRoutes = ["/admin", "/admin/users", "/admin/requests", "/admin/requirements", "/admin/sectors", "/admin/links"];

  console.log("--- anonymous EN ---");
  for (const r of publicRoutes) await crawl(r, null, {}, "anon");
  for (const r of protectedRoutes) await crawl(r, null, { landsOn: "/login", maxRedirects: 2 }, "anon");
  for (const r of adminRoutes) await crawl(r, null, { landsOn: "/login", maxRedirects: 2 }, "anon");

  console.log("--- anonymous AR ---");
  for (const r of publicRoutes) await crawl(`${r}?lang=ar`, null, {}, "anon-ar");
  await crawl("/dashboard?lang=ar", null, { landsOn: "/login", maxRedirects: 2 }, "anon-ar");

  console.log("--- authenticated user ---");
  for (const r of protectedRoutes) await crawl(r, userCookie, {}, "user");
  // Auth pages redirect a real session exactly once to its home.
  await crawl("/login", userCookie, { landsOn: "/dashboard", maxRedirects: 2 }, "user");
  await crawl("/register", userCookie, { landsOn: "/dashboard", maxRedirects: 2 }, "user");
  // Non-admin bounced off admin, never looping.
  await crawl("/admin", userCookie, { landsOn: "/dashboard", maxRedirects: 2 }, "user");

  if (adminCookie) {
    console.log("--- admin ---");
    for (const r of adminRoutes) await crawl(r, adminCookie, {}, "admin");
    await crawl("/login", adminCookie, { landsOn: "/admin", maxRedirects: 2 }, "admin");
  } else {
    console.log("(no admin user in DB — admin crawl skipped)");
  }

  console.log("--- stale cookie (DB session revoked, JWT still valid) ---");
  await prisma.session.deleteMany({ where: { userId: reg.userId } });
  await crawl("/login", userCookie, {}, "stale");
  await crawl("/register", userCookie, {}, "stale");
  await crawl("/dashboard", userCookie, { landsOn: "/login", maxRedirects: 2 }, "stale");
  await crawl("/workspace?lang=ar", userCookie, { landsOn: "/login", maxRedirects: 2 }, "stale");

  // Cleanup the smoke user.
  await prisma.auditLog.deleteMany({ where: { userId: reg.userId } });
  const org = await prisma.organizationMembership.findFirst({ where: { userId: reg.userId } });
  await prisma.user.deleteMany({ where: { id: reg.userId } });
  if (org) await prisma.organization.deleteMany({ where: { id: org.organizationId } });
  await prisma.$disconnect();

  if (failures > 0) {
    console.error(`\n${failures} route(s) failed.`);
    process.exit(1);
  }
  console.log("\nAll route smoke checks passed.");
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
