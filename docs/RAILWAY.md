# Railway production checklist (Stage 2)

## Required variables (web service)

| Variable | Notes |
|---|---|
| `DATABASE_URL` | From Railway Postgres plugin (private URL preferred) |
| `AUTH_SECRET` | `openssl rand -base64 32` — must be ≥32 chars, not a placeholder |
| `NEXT_PUBLIC_APP_URL` | Public HTTPS origin, e.g. `https://your-app.up.railway.app` |
| `REDIS_URL` | From Railway Redis plugin (required unless `ALLOW_MEMORY_RATE_LIMIT=true`) |
| `ALLOW_DEMO_PAYMENTS` | Must be `false` or unset |
| `NODE_ENV` | `production` |

## Optional

| Variable | Notes |
|---|---|
| `PAYMENT_PROVIDER_KEY` | Real provider key when checkout is live |
| `PAYMENT_WEBHOOK_SECRET` | HMAC secret for `/api/payments/webhook` |
| `ALLOW_MEMORY_RATE_LIMIT` | Explicit escape hatch only; not recommended for multi-instance |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Strong password required if seeding production |

## Database deploy — use migrations, never `db push`

Production uses Prisma **migrations** (`prisma migrate deploy`). `prisma db push`
is a dev-only convenience and must NOT be in the production deploy path — it
refuses to add required columns to tables that already contain rows (the exact
Railway failure this replaced).

`railway.json` wires this automatically:

```jsonc
"deploy": { "preDeployCommand": "npx prisma migrate deploy", "startCommand": "npm run start" }
```

**One-time action for existing deployments:** if the Railway service has a
custom Start/Deploy command in the dashboard that runs `prisma db push`, remove
it so `railway.json` (`preDeployCommand`) takes effect. `npm run build` already
runs `prisma generate`.

Manual equivalent (or first-time provisioning of a fresh database):

```bash
npx prisma migrate deploy
# optional seed (refuses default admin password when NODE_ENV=production):
npx tsx prisma/seed.ts
```

**Databases that predate the migration baseline** (previously managed with
`db push`) need a one-time reconciliation before `migrate deploy` will work —
see [PRODUCTION_MIGRATION_RECONCILIATION.md](./PRODUCTION_MIGRATION_RECONCILIATION.md).

**Session migration note:** Stage 2 stores `Session.tokenHash` (SHA-256) instead of raw tokens.
Existing sessions are incompatible — users must log in again after deploy.

## Health endpoints

- `GET /api/health/db` — `{ ok, database }` only (rate limited, no-store)
- `GET /api/health/ready` — config presence checks without secret values
