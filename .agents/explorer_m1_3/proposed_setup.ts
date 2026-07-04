import { beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { db } from '@/lib/db';

// Enforce test database file URL to prevent touching development database
process.env.DATABASE_URL = 'file:./test.db';

beforeAll(async () => {
  // Synchronously execute prisma db push to ensure schema is fully created on test.db
  try {
    execSync('npx prisma db push --accept-data-loss', {
      env: { ...process.env, DATABASE_URL: 'file:./test.db' },
      stdio: 'inherit',
    });
  } catch (error) {
    console.error('Failed to run prisma db push on test database:', error);
    throw error;
  }
});

afterAll(async () => {
  // Disconnect the active prisma client connection
  await db.$disconnect();
});
