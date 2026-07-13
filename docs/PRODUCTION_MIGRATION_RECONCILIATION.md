# Production migration reconciliation (one-time)

The Railway database predates the repaired Prisma migration baseline and was
previously managed with `prisma db push`. As a result it has the base tables but
is missing Stage 2 schema (`Session.tokenHash`, `Payment.idempotencyKey`,
`PaymentEvent`) and Stage 3 ownership (`Assessment.organizationId`,
`Payment.organizationId`), so `db push` refuses to add the new **required**
columns to tables that already contain rows.

This runbook brings that database up to the current migration history
**without losing any user, assessment, payment, report, or audit data**. Only
the ~2 legacy `Session` rows are removed (raw tokens can't be re-hashed into the
Stage 2 `tokenHash`; users simply log in again).

> This exact sequence was verified locally against a synthetic copy of the
> pre-Stage-2 schema seeded with 3 users / 3 assessments / 3 payments / 2
> sessions / 3 report requests / 2 audit logs. Result: **all business rows
> preserved**, 3 organizations + OWNER memberships + company profiles
> backfilled, `organizationId` populated on every assessment and payment,
> `migrate status` = "up to date", all 4 migrations recorded.

`$DATABASE_URL` below is the **production** Postgres URL. Keep it only in your
shell environment — never commit it or paste it into logs.

---

## 0. Back up first (mandatory)

- Take a Railway Postgres **snapshot/backup** (dashboard → Postgres → Backups),
  or `pg_dump "$DATABASE_URL" -Fc -f prod-backup-$(date +%F).dump`.
- Do not proceed until the backup is confirmed.

## 1. Record the starting state (for the rollback plan)

```bash
psql "$DATABASE_URL" -c "SELECT
  (SELECT count(*) FROM \"User\") AS users,
  (SELECT count(*) FROM \"Session\") AS sessions,
  (SELECT count(*) FROM \"Assessment\") AS assessments,
  (SELECT count(*) FROM \"Payment\") AS payments,
  (SELECT count(*) FROM \"ReportRequest\") AS report_requests,
  (SELECT count(*) FROM \"AuditLog\") AS audit_logs;"

# Migration history (likely empty or a rolled-back row for a db-push database)
psql "$DATABASE_URL" -c 'SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations;' 2>/dev/null || echo "no _prisma_migrations table yet"
```

## 2. Inspect (confirm the assumptions — do not guess)

```bash
psql "$DATABASE_URL" -c "SELECT string_agg(column_name, ',') FROM information_schema.columns WHERE table_name='Session';"     # expect legacy 'token', no 'tokenHash'
psql "$DATABASE_URL" -c "SELECT count(*) FROM information_schema.columns WHERE table_name='Payment' AND column_name='organizationId';"    # expect 0
psql "$DATABASE_URL" -c "SELECT count(*) FROM information_schema.tables WHERE table_name IN ('Organization','PaymentEvent');"  # expect 0
```

If `Session` already has `tokenHash` (no `token`) and the DB already has
`Organization`/`organizationId`, this runbook does not apply — stop and review.

## 3. Bridge the pre-Stage-2 schema up to the `0_init` baseline

`prisma/production-reconcile/bridge.sql` is idempotent and data-preserving
(it only removes `Session` rows). Apply it:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f prisma/production-reconcile/bridge.sql
```

Confirm the schema now matches `0_init` — a diff to the full migration set must
show **no** Stage-2 gaps (`tokenHash` / `PaymentEvent` / `idempotencyKey`), only
the Stage 3/4/4.5 additions still to come. Use any throwaway empty DB as the
shadow:

```bash
npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-migrations ./prisma/migrations \
  --shadow-database-url "$SHADOW_DATABASE_URL" \
  --script | grep -iE 'tokenHash|"PaymentEvent"|idempotencyKey' && echo "STOP: Stage-2 gap remains" || echo "OK: bridged to 0_init"
```

## 4. Baseline `0_init` as applied

The schema now equals `0_init`, so record it as applied **without** re-running it:

```bash
npx prisma migrate resolve --applied 0_init
```

## 5. Apply Stage 3 / 4 / 4.5

```bash
npx prisma migrate deploy
```

Stage 3's migration adds `organizationId` **nullable**, backfills a personal
Organization + OWNER membership + CompanyProfile for every existing user,
attaches each existing assessment and payment to its owner's organization, then
sets the columns `NOT NULL`. Stage 4 and 4.5 add the rules-engine and governance
tables. Historical data is untouched.

## 6. Verify

```bash
psql "$DATABASE_URL" -c "SELECT
  (SELECT count(*) FROM \"User\") AS users,
  (SELECT count(*) FROM \"Assessment\") AS assessments,
  (SELECT count(*) FROM \"Payment\") AS payments,
  (SELECT count(*) FROM \"Organization\") AS orgs,
  (SELECT count(*) FROM \"Assessment\" WHERE \"organizationId\" IS NULL) AS assessments_missing_org,
  (SELECT count(*) FROM \"Payment\" WHERE \"organizationId\" IS NULL) AS payments_missing_org;"
#   users/assessments/payments == step 1; orgs == users; *_missing_org == 0

npx prisma migrate status   # "Database schema is up to date!"
```

## 7. Remove `db push` from the deploy path

- `railway.json` already sets `deploy.preDeployCommand = "npx prisma migrate deploy"`.
- In the Railway dashboard, **delete any custom Start/Deploy command that runs
  `prisma db push`** so `railway.json` takes effect. `npm run build` runs
  `prisma generate`.
- Redeploy. From now on every deploy runs `prisma migrate deploy`.

## Rollback plan

- Steps 3–5 are additive/backfill; the only destructive action is `DELETE FROM
  "Session"` (2 rows — acceptable, users re-login).
- If anything looks wrong before step 7, restore the Step 0 snapshot. No user or
  business data was mutated destructively, so a restore returns to the exact
  pre-reconciliation state.
- After step 5 completes, the database is on the standard migration history; no
  further manual bridging is ever required.
