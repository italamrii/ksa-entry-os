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

## Database deploy

```bash
npx prisma generate
npx prisma db push
# optional seed (refuses default admin password when NODE_ENV=production):
npx tsx prisma/seed.ts
```

**Session migration note:** Stage 2 stores `Session.tokenHash` (SHA-256) instead of raw tokens.
Existing sessions are incompatible — users must log in again after deploy.

## Health endpoints

- `GET /api/health/db` — `{ ok, database }` only (rate limited, no-store)
- `GET /api/health/ready` — config presence checks without secret values
