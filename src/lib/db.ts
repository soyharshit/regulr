import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function getDatabaseUrl() {
  return process.env.DATABASE_URL || "file:./dev.db";
}

function createAdapter(databaseUrl: string) {
  if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
    return new PrismaPg(databaseUrl);
  }

  if (databaseUrl.startsWith("file:")) {
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
