#!/usr/bin/env bash
# Vercel production build for Regulr (Postgres).
set -e

SCHEMA="prisma/schema.postgres.prisma"

# Generate the Postgres Prisma client (no DB connection needed).
prisma generate --schema "$SCHEMA"

# Create/sync the schema on the database (fast — DDL only).
# Skipped on the very first deploy (before DATABASE_URL is set) so the
# landing page still goes live. Demo data is seeded separately
# (npm run seed:postgres) — kept out of the build to keep deploys fast.
if [ -n "$DATABASE_URL" ]; then
  echo "DATABASE_URL detected — syncing schema…"
  # Neon's pooled connection can't run schema DDL — use the unpooled URL.
  PUSH_URL="${DATABASE_URL_UNPOOLED:-${POSTGRES_URL_NON_POOLING:-$DATABASE_URL}}"
  prisma db push --schema "$SCHEMA" --url "$PUSH_URL" --accept-data-loss
else
  echo "No DATABASE_URL set — skipping schema sync."
fi

next build
