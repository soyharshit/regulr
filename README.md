# Regulr

Regulr is a multi-tenant cafe SaaS for Indian cafes. It includes:

- Customer storefronts at `{slug}.regulr.in` with menu browsing, cart checkout, live order tracking, and rewards.
- Owner dashboards at `app.regulr.in` for orders, menu, customers, billing, growth, and settings.
- Superadmin operations at `admin.regulr.in` for analytics, cafe onboarding, audit, and support workflows.

## Launch Version

Launch candidate: `0.1.0`

Current verified gates:

- `npm run seed:demo`
- `npm test`
- `npm run build`

## Requirements

- Node.js 20+
- npm 10+
- SQLite for local/demo use
- PostgreSQL for production launch

## Environment

Create `.env` from `.env.example`.

Required variables:

```bash
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-strong-secret"
NEXT_PUBLIC_ROOT_DOMAIN="localhost"
```

Production should use PostgreSQL:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
NEXTAUTH_URL="https://app.regulr.in"
NEXTAUTH_SECRET="generate-a-strong-random-secret"
NEXT_PUBLIC_ROOT_DOMAIN="regulr.in"
```

## Local Setup

```bash
npm install
npm run db:generate
npm run seed:demo
npm run dev
```

Open:

- Marketing: `http://localhost:3000`
- Owner dashboard: `http://localhost:3000/?__cafe=app`
- Superadmin: `http://localhost:3000/?__cafe=admin`
- Storefront: `http://localhost:3000/?__cafe=brew-haven`

Demo credentials use `password123`:

- Superadmin: `superadmin@regulr.in`
- Owner: `owner1@brewhaven.com`
- Owner: `owner2@chaipoint.com`
- Owner: `owner3@espressolab.com`

## Quality Gates

```bash
npm run seed:demo
npm test
npm run build
npm run test:e2e
```

The E2E suite runs on port `3100` by default to avoid collisions with a normal dev server on port `3000`. Override with `E2E_PORT`.

## Production Deployment

1. Provision PostgreSQL and set `DATABASE_URL`.
2. Set `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `NEXT_PUBLIC_ROOT_DOMAIN`.
3. Configure wildcard DNS for `*.regulr.in` plus `regulr.in` and `www.regulr.in`.
4. Configure TLS for wildcard subdomains.
5. Generate Prisma client with the production schema if using PostgreSQL:

```bash
npm run db:generate:postgres
npm run db:push:postgres
```

6. Build and start:

```bash
npm run build
npm run start
```

## Notes

- All currency calculations are integer paise.
- Storefront metadata and menu access go through repository helpers.
- Middleware maps root traffic to marketing, `app` to dashboard, `admin` to superadmin, and any other tenant slug to storefront.
