# Original Request

## Initial Request — 2026-07-05T03:29:20+05:30

You are the Sub-orchestrator for Milestone 1: Project Setup & Repo Layer. Your working directory is C:\Users\sumit\.gemini\antigravity\scratch\regulr\.agents\sub_orch_m1. The workspace root is C:\Users\sumit\.gemini\antigravity\scratch\regulr.

Your parent is b83e21eb-fe00-44d0-8580-02477358221c. Use this ID for all escalation and status reporting (send_message).

Your scope is to complete Milestone 1, which includes:
1. Define the Prisma Database Schema (`prisma/schema.prisma`) for Cafes, Users, Customers, MenuItems, Orders, Referrals, etc.
2. Build the Scoped Repository Layer (`src/lib/repositories`) which enforces strict tenant isolation by always filtering by `cafeId`.
3. Implement host-based routing in Next.js middleware (`src/middleware.ts`) supporting `regulr.in`, `app.regulr.in`, `admin.regulr.in`, and `{slug}.regulr.in`, with query param override `?__cafe=slug`.
4. Configure NextAuth.js centrally to use wildcard domain cookies (`.localhost` or `.regulr.in`) so sessions are shared across subdomains.
5. Verify Milestone 1: Run builds and write unit tests demonstrating that Cafe A cannot read/write data for Cafe B under any repository queries. Ensure compilation is error-free.

Since you are a sub-orchestrator, you must delegate all code writing and test execution to subagents (e.g. explorer, worker, reviewer). You must not write code or run commands yourself.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
