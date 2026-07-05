# Deploying Regulr to Vercel

The app is database-agnostic:
- **Local dev / tests** → SQLite (`prisma/schema.prisma`)
- **Production (Vercel)** → Postgres (`prisma/schema.postgres.prisma`)

`src/lib/db.ts` picks the right driver at runtime from `DATABASE_URL`.
The Vercel build (see `vercel.json`) automatically pushes the schema, seeds demo
data, and builds — so once the env vars are set, a deploy is fully hands-off.

## One-time setup

### 1. Create a Postgres database
Easiest: in the Vercel project → **Storage → Create Database → Postgres (Neon)**.
It auto-injects `DATABASE_URL`. Or use Supabase/Neon and copy the **pooled**
connection string.

### 2. Set environment variables (Vercel → Settings → Environment Variables)
| Name | Value |
|------|-------|
| `DATABASE_URL` | your Postgres connection string (auto-set if you used Vercel Postgres) |
| `NEXTAUTH_SECRET` | run `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://<your-app>.vercel.app` |
| `NEXT_PUBLIC_ROOT_DOMAIN` | *(optional)* your custom domain, e.g. `regulr.in` |

### 3. Deploy
Push to GitHub (Vercel auto-deploys) or run `vercel --prod`. The build:
1. `prisma db push` — creates all tables on Postgres
2. `prisma generate` — generates the Postgres client
3. seeds demo data (idempotent; safe to re-run)
4. `next build`

## Demo logins (after seed)
- Superadmin: `superadmin@regulr.in` / `password123`
- Owner: `owner1@brewhaven.com` / `password123`
- Customer: `arjun.sharma@brew-haven.demo` / `password123`

## Routing notes
The app is multi-tenant by subdomain (`app.`, `admin.`, `{cafe-slug}.`). On a
plain `*.vercel.app` URL those subdomains don't resolve, but the middleware
falls back to path-based access, so everything is reachable:
- `/` — marketing
- `/dashboard` — owner console
- `/admin` — superadmin
- `/store/brew-haven` — a cafe storefront

For real subdomain multi-tenancy, add a **custom domain with a wildcard**
(`*.yourdomain.com`) in Vercel and set `NEXT_PUBLIC_ROOT_DOMAIN`.

## Troubleshooting
- **Build fails at `prisma db push`** — `DATABASE_URL` isn't set/reachable. Add it, redeploy.
- **`db push` errors on a pooled connection** — use the **direct** (non-pooled) URL for
  `DATABASE_URL`, or run `npm run db:push:postgres` locally once against the DB.
- **Seed didn't run** — it's non-fatal in the build; run `npm run seed:postgres` locally
  with the production `DATABASE_URL` exported.
