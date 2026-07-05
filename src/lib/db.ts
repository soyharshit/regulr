import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function getDatabaseUrl() {
  return process.env.DATABASE_URL || "file:./dev.db";
}

function createAdapter(databaseUrl: string) {
  if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
    // Lazy require so the native better-sqlite3 module is never pulled into a
    // Postgres-only (e.g. Vercel serverless) bundle.
    const { PrismaPg } = require("@prisma/adapter-pg");
    return new PrismaPg({ connectionString: databaseUrl });
  }

  if (databaseUrl.startsWith("file:")) {
    const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
    return new PrismaBetterSqlite3({ url: databaseUrl });
  }

  throw new Error("DATABASE_URL must be a file:, postgres:, or postgresql: URL");
}

export function getDb() {
  if (!globalForPrisma.prisma) {
    const databaseUrl = getDatabaseUrl();
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      adapter: createAdapter(databaseUrl),
    });
  }

  return globalForPrisma.prisma;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    const client = getDb();
    const value = Reflect.get(client, property, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
