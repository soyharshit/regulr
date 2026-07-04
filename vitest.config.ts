import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    conditions: ['node'],
  },
  test: {
    server: {
      deps: {
        external: ['@prisma/client', '.prisma/client'],
      },
    },
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/unit/setup.ts'],
    include: ['tests/unit/**/*.test.ts'],
    poolOptions: {
      threads: {
        singleThread: true, // Prevents SQLite locking issues
      },
    },
  },
});
