#!/usr/bin/env bash
# Vercel production build for Regulr (Postgres).
set -e

SCHEMA="prisma/schema.postgres.prisma"

# Generate the Postgres Prisma client (no DB connection needed).
prisma generate --schema "$SCHEMA"

# If a database is configured, create the schema and seed demo data.
# Skipped on the very first deploy (before DATABASE_URL is set) so the
# landing page still goes live.
if [ -n "$DATABASE_URL" ]; then
  echo "DATABASE_URL detected — pushing schema and seeding…"
  prisma db push --schema "$SCHEMA" --skip-generate --accept-data-loss
  npx tsx prisma/seed.ts || echo "seed skipped (non-fatal)"
else
  echo "No DATABASE_URL set — skipping db push/seed."
fi

next build
