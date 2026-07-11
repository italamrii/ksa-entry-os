# KSA Entry OS

**Navigate Saudi market entry with confidence.**

A production-quality B2B SaaS MVP that helps foreign and local companies understand the steps required to enter the Saudi market. This platform provides advisory navigation and official links only — it is **not** a law firm, tax advisor, government entity, or transaction-processing service.

## Features

- User registration with minimal data (no sensitive documents)
- Assessment wizard with rules-based roadmap generation
- Bilingual support (English / Arabic, LTR / RTL)
- Dark and light mode
- PDF report export (paid plans)
- Payment status tracking (demo mode — no card storage)
- Admin dashboard for users, requests, sectors, requirements, and official links
- Security hardening (Argon2id, HttpOnly cookies, rate limiting, RBAC, audit logs)
- Legal pages with disclaimers

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- Prisma + PostgreSQL
- Custom auth (Argon2id + JWT sessions)
- Zod + React Hook Form
- pdf-lib for PDF generation

## Prerequisites

- Node.js 20+
- PostgreSQL 14+

## Setup

```bash
# Clone and install
cd ksa-entry-os
npm install

# Configure environment
cp .env.example .env
# Edit DATABASE_URL and AUTH_SECRET

# Database setup
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Default Admin (after seed)

- Email: `admin@ksaentryos.com`
- Password: `ChangeMe123!Secure`

**Change these credentials immediately in production.**

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed sectors, authorities, requirements |
| `npm run db:studio` | Open Prisma Studio |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (must be set on the **web** service in Railway) |
| `AUTH_SECRET` | Yes | Min 32 chars for JWT signing |
| `NEXT_PUBLIC_APP_URL` | Yes | App URL (e.g. http://localhost:3000) |
| `PAYMENT_PROVIDER_KEY` | No | Payment provider API key |
| `SEED_ADMIN_EMAIL` | No | Admin email for seed |
| `SEED_ADMIN_PASSWORD` | No | Admin password for seed |

### Railway registration checklist

1. Attach the Postgres plugin and copy `DATABASE_URL` onto the **web** service variables (Reference Variable → Postgres → `DATABASE_URL`).
2. Prefer the private URL when web + Postgres share a Railway private network; use `DATABASE_PUBLIC_URL` only if private connectivity fails.
3. After deploy: `npx prisma db push && npx tsx prisma/seed.ts`
4. Verify connectivity: `GET /api/health/db` should return `{ ok: true, database: "connected" }`
5. Verify persistence: `npm run test:register` (creates and deletes a throwaway user)

## Security Notes

- Passwords hashed with **Argon2id**
- Sessions stored in HttpOnly cookies
- Rate limiting on auth, assessments, PDF generation, payments
- RBAC: USER / ADMIN roles
- Audit logs for login, admin edits, report generation, payment changes
- Security headers: CSP, X-Frame-Options, HSTS (production)
- No payment card data stored — only provider ID, amount, status, invoice number
- Generic auth error messages
- Account lockout after 5 failed login attempts (15 min)

## Deployment

### Vercel

1. Connect repository
2. Set environment variables
3. Add PostgreSQL (Neon, Supabase, or Railway)
4. Run `prisma db push` and `prisma db seed` against production DB
5. Deploy

### Railway

1. Create PostgreSQL service
2. Create web service from repo
3. Set `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`
4. Add build command: `npm run build`
5. Add start command: `npm start`
6. Run migrations: `npx prisma db push && npx tsx prisma/seed.ts`

## Data Collected

**Collected:** Account name/email, company name, country, sector, assessment responses, payment status.

**NOT collected:** IDs, passports, documents, bank cards, owner details, financial statements, CR numbers.

## Disclaimer

This platform provides general guidance only. Users must verify all requirements with official authorities or licensed advisors before making decisions.

## License

Private — All rights reserved.
