import { test as base } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const databaseUrl = process.env.DATABASE_URL || "file:./prisma/test.db";
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });

const prisma = new PrismaClient({
  adapter,
});

export const test = base.extend<{ db: PrismaClient }>({
  db: async ({}, use) => {
    // Before test: Clean up dynamic transaction tables
    // Ensure all references are wiped clean
    try {
      await prisma.order.deleteMany({});
      await prisma.customer.deleteMany({});
    } catch (e) {
      console.warn("Failed to truncate tables in test setup:", e);
    }
    
    await use(prisma);
  },
});
