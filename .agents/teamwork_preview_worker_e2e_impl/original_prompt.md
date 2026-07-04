## 2026-07-04T22:03:49Z

We need to implement the database seed script and the E2E tests in the codebase.

Please perform the following steps:
1. Register the Prisma seed command in `package.json`. Add the following key to `package.json` at the root level:
```json
  "prisma": {
    "seed": "npx tsx prisma/seed.ts"
  }
```
2. Create the file `prisma/seed.ts` with the following content to populate the database with test data:
... [Rest of user request] ...
