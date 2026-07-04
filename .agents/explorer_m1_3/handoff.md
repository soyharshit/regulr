# Milestone 1: Setup, Repository Isolation, & Build Analysis Report

This report provides the analysis, recommendations, and code proposals for the Milestone 1 (Project Setup & Repo Layer) unit testing framework, tenant isolation tests, and build configurations.

---

## 1. Observation

During my investigation of the codebase and project specifications, I observed the following details:

1. **Package Configuration (`package.json`)**:
   - The current dependencies do not include any testing framework or testing runners.
   - The current scripts block contains:
     ```json
     "scripts": {
       "dev": "next dev",
       "build": "next build",
       "start": "next start",
       "lint": "next lint"
     }
     ```
   - The project uses Next.js `14.2.35` and Prisma Client/CLI `^7.8.0`.

2. **Database Schema (`prisma/schema.prisma`)**:
   - The models currently defined are: `Cafe`, `User`, `Customer`, `MenuItem`, and `Order`.
   - The `Referral` model is completely missing, despite being specified in `SCOPE.md` under `Referral Repository (src/lib/repositories/referral.ts)` and `Milestones (M1.1: Database Schema)`.
   - The `datasource db` configuration is missing the `url` property:
     ```prisma
     datasource db {
       provider = "sqlite"
     }
     ```
     *(Note: This URL parameter is dynamically injected in `prisma.config.ts` via the new Prisma configuration schema, but standard CLI commands and editors complain when `url` is absent from the schema file itself.)*

3. **TypeScript Configuration (`tsconfig.json`)**:
   - Path aliases are configured using `@/*` pointing to `./src/*`:
     ```json
     "paths": {
       "@/*": ["./src/*"]
     }
     ```
   - TypeScript is configured to include all `.ts` and `.tsx` files in the root folder, meaning the `tests` directory will be included in type-checking:
     ```json
     "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]
     ```

4. **Middleware Configuration (`src/middleware.ts`)**:
   - The middleware uses path rewriting to handle subdomains (e.g., routing `app.localhost` to `/(app)/app`).
   - The middleware executes inside Next.js's Edge Runtime. There are no imports of Prisma or `db.ts`, which is correct since Prisma/SQLite do not support the Edge Runtime environment.

---

## 2. Logic Chain

From these observations, I developed the following reasoning for our recommendations:

1. **Test Runner Choice (Vitest vs. Jest)**:
   - Next.js 14 and ESM (ES Modules) have historically had integration friction with Jest due to Jest's commonjs-first execution engine. Compiling typescript and ESM imports in Jest requires complex `babel`, `ts-jest`, or Next-specific transformers that slow down execution and break on package resolutions.
   - **Vitest** runs on Vite (esbuild), providing native, zero-config TypeScript and ESM compilation out of the box. It is significantly faster and doesn't suffer from ESM-import issues common to Next.js project layouts.
   - Path mapping configured in `tsconfig.json` (such as `@/lib/db`) can be dynamically resolved in Vitest using the plugin `vite-tsconfig-paths`, avoiding the need to manually replicate alias pathways.
   - **Conclusion**: Vitest is the ideal testing runner for this Next.js 14 + Prisma stack.

2. **Tenant Isolation Testing Strategy (Real DB vs. Mocking)**:
   - A mock-based repository test (using tools like `vitest-mock-extended`) only tests the structure of the mock calls. If a developer implements a repository method without the mandatory `where: { cafeId }` filter, but writes a mock that matches their incorrect arguments, the test passes while allowing cross-tenant data leaks in production.
   - Since we are using SQLite (`provider = "sqlite"`), we can spin up a dedicated, clean test database (`test.db`) instantly during test setup.
   - By creating and running queries against a real test database with seeded test data for `Cafe A` and `Cafe B`, we can verify that repository queries actually restrict database reads and writes. If a developer forgets a `where: { cafeId }` clause, the database will return both cafes' records, and the isolation test will immediately catch the leak and fail.
   - **Conclusion**: Repository unit tests must run against a real SQLite database (`test.db`) created via `npx prisma db push --accept-data-loss`. Tests must run sequentially (`singleThread: true` in Vitest) to prevent concurrent write locks in SQLite.

3. **Database Schema Enhancements**:
   - The `ReferralRepository` requires a database table for `Referral`.
   - To link referrals correctly across tenants and users, we must define a `Referral` model referencing `Cafe`, `Customer` (the referrer), and `User` (the referred target).
   - **Conclusion**: Extend `prisma/schema.prisma` to include the `Referral` model along with correct relations.

4. **Build Compilation and Globals**:
   - Because `tsconfig.json` includes `tests`, running `next build` will typecheck the tests.
   - If we enable Vitest globals (like `describe` and `it` without importing them), we would need to add `"types": ["vitest/globals"]` to the main `tsconfig.json`, polluting the production build configuration.
   - **Conclusion**: Explicitly import testing keywords (`describe`, `it`, `expect`, `beforeAll`, `beforeEach`) from `'vitest'` in test files. This keeps the production TypeScript build context clean.

---

## 3. Caveats

- **SQLite Multi-Threading**: SQLite does not support highly concurrent write operations. If unit tests are run in parallel, they may throw `SQLITE_BUSY` errors. We avoid this by running tests in single-thread mode (`singleThread: true`).
- **Edge Runtime limitations**: The middleware must remain completely isolated from any database client or repositories, as standard SQLite Prisma calls do not work in the Next.js Edge Runtime.
- **Offline / Sandboxed execution**: The proposed testing pipeline is entirely local and does not require active internet or Docker servers, complying with the CODE_ONLY sandbox constraints.

---

## 4. Conclusion & Code Proposals

I propose the following architecture, dependencies, and code configuration for Milestone 1.

### 4.1 Dependency Additions (`package.json`)
Add the following scripts and devDependencies:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^1.6.0",
    "vite-tsconfig-paths": "^4.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "vitest-mock-extended": "^1.3.0"
  }
}
```

### 4.2 Extended Database Schema (`prisma/schema.prisma`)
Modify the database schema to enable dynamic URL configurations and add the `Referral` model and its relations:

```prisma
// prisma/schema.prisma (Proposed changes)

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Cafe {
  id          String     @id @default(uuid())
  slug        String     @unique
  name        String
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  menuItems   MenuItem[]
  orders      Order[]
  customers   Customer[]
  referrals   Referral[] // Added relation
}

model User {
  id                String     @id @default(uuid())
  email             String     @unique
  name              String?
  role              String     @default("CUSTOMER")
  createdAt         DateTime   @default(now())
  updatedAt         DateTime   @updatedAt
  customers         Customer[]
  referralsReceived Referral[] @relation("ReferredRelation") // Added relation
}

model Customer {
  id            String     @id @default(uuid())
  cafeId        String
  userId        String
  points        Int        @default(0)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  cafe          Cafe       @relation(fields: [cafeId], references: [id], onDelete: Cascade)
  user          User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  referralsMade Referral[] @relation("ReferrerRelation") // Added relation

  @@unique([cafeId, userId])
}

// Added Referral Model
model Referral {
  id             String    @id @default(uuid())
  cafeId         String
  referrerId     String    // Customer who refers
  referredId     String    // User who is referred
  completed      Boolean   @default(false)
  pointsAwarded  Int       @default(0)
  completedAt    DateTime?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  cafe           Cafe      @relation(fields: [cafeId], references: [id], onDelete: Cascade)
  referrer       Customer  @relation("ReferrerRelation", fields: [referrerId], references: [id], onDelete: Cascade)
  referred       User      @relation("ReferredRelation", fields: [referredId], references: [id], onDelete: Cascade)
}
```

### 4.3 Vitest Configuration (`vitest.config.ts`)
Create a configuration file at the project root to load path aliases and React compiling (if UI testing is expanded later):

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
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
```

### 4.4 Vitest Setup script (`tests/unit/setup.ts`)
Creates and migrates the test database before the tests begin:

```typescript
// tests/unit/setup.ts
import { beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { db } from '@/lib/db';

process.env.DATABASE_URL = 'file:./test.db';

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
```

### 4.5 Tenant Isolation Test Suite (`tests/unit/repositories.test.ts`)
This test suite verifies that `Cafe A` cannot read, write, or access `Cafe B`'s records. For mutation tests (updates/deletes), we assert that attempting cross-tenant manipulation triggers an error and keeps the targeted records unchanged.

*(Note: File was saved as `proposed_repositories.test.ts` in the agent working folder)*

---

## 5. Verification Method

To independently verify the configuration and compile status:

1. **Install testing dependencies**:
   ```bash
   npm install --save-dev vitest vite-tsconfig-paths @vitejs/plugin-react vitest-mock-extended
   ```
2. **Apply the Extended Prisma Schema**:
   Overwrite `prisma/schema.prisma` with the proposed content and regenerate Prisma Client:
   ```bash
   npx prisma generate
   ```
3. **Execute Unit Tests**:
   Run the tests to ensure that everything is syntactically sound (they will pass once the repository implementations are completed):
   ```bash
   npm run test
   ```
4. **Compile Production Build**:
   Verify that Next.js and TypeScript compile without type conflicts:
   ```bash
   npm run build
   ```
5. **Invalidation condition**:
   The verification fails if any repository method allows accessing/editing data belonging to a different `cafeId` than the one supplied to the query, or if the compiler fails on TypeScript issues inside the `tests/` directory during `npm run build`.
