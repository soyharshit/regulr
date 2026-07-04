process.env.DATABASE_URL = 'file:./test.db';
process.env.PRISMA_CLIENT_ENGINE_TYPE = 'library';

import { beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { db } from '@/lib/db';

beforeAll(async () => {
  try {
    // Run schema push on the isolated test database
    execSync('npx prisma db push --accept-data-loss', {
      env: { ...process.env, DATABASE_URL: 'file:./test.db' },
      stdio: 'inherit',
    });
  } catch (error) {
    console.error('Failed to migrate test database:', error);
    throw error;
  }
});

afterAll(async () => {
  await db.$disconnect();
});
