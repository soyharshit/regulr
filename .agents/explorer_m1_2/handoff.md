# Handoff Report: Host-Based Routing & NextAuth Wildcard Cookies

This report provides a detailed analysis of the current routing middleware and details the design and implementation steps for configuring wildcard authentication cookies in NextAuth.js.

## 1. Observation
Direct observations of the codebase:
- **Middleware File** (`src/middleware.ts`): We inspected the current middleware which handles host-based subdomains and routing overrides:
  ```typescript
  // Lines 25-30:
  let subdomain = "";
  if (hostname.endsWith(".regulr.in")) {
    subdomain = hostname.replace(".regulr.in", "");
  } else if (hostname.endsWith(".localhost")) {
    subdomain = hostname.replace(".localhost", "");
  }
  ```
  It splits ports and checks host suffixes, but does not support configurable root domains, does not perform authentication or role checks, does not prevent authentication redirect loops, and does not propagate parsed tenant parameters downstream.
- **Database Schema** (`prisma/schema.prisma`): The user model contains roles required for authorization:
  ```prisma
  model User {
    id            String     @id @default(uuid())
    email         String     @unique
    name          String?
    role          String     @default("CUSTOMER") // SUPERADMIN, OWNER, STAFF, CUSTOMER
    ...
  }
  ```
- **Dependencies** (`package.json`): The package has Next.js `14.2.35` and NextAuth `4.24.14` installed, but does not contain NextAuth routes (`src/app/api/auth/[...nextauth]`) or config (`src/lib/auth.ts`). No Prisma database adapter is installed.
- **Command Output**: `npm run lint` and `npm run build` executed successfully without any errors.

---

## 2. Logic Chain
Step-by-step reasoning from observations to proposals:

1. **Subdomain Routing & Wildcard Handling**:
   - The current subdomain extraction uses `hostname.replace(".regulr.in", "")`. In an environment where the root domain changes (e.g., a staging build on Vercel), this hardcoded check fails.
   - **Improvement**: We should configure the root domain dynamically using `process.env.NEXT_PUBLIC_ROOT_DOMAIN` (falling back to `regulr.in`) and extract subdomains using `.endsWith()` and `.slice()`.

2. **Middleware Authentication and Role Guarding**:
   - The app has two restricted subdomains: `app.regulr.in` (for Owners and Staff) and `admin.regulr.in` (for Superadmins). Storefront subdomains (`{slug}.regulr.in`) are public.
   - We must extract the NextAuth session token using `next-auth/jwt`'s `getToken` inside the middleware.
   - If a request is unauthenticated, redirect to `/login` with the original URL set as `callbackUrl`.
   - If authenticated, check the `token.role` attribute:
     - `admin` subdomain: strictly requires `SUPERADMIN`.
     - `app` subdomain: requires `OWNER`, `STAFF`, or `SUPERADMIN`.
     - If unauthorized, return a `403 Forbidden` response.
   - **Redirect Loops**: To prevent redirect loops, public paths on protected subdomains (such as `/login`, `/signup`, or routes starting with `/auth`) must bypass the authentication checks.

3. **Context Propagation**:
   - Page routes and downstream components will need to know which cafe is being queried. Rather than requiring them to parse the host header manually, the middleware should inject a custom header `x-tenant-slug` containing the resolved tenant or subdomain before executing `NextResponse.rewrite()`.

4. **Wildcard Cookie Sharing**:
   - By default, cookies set on `app.regulr.in` are not accessible on other subdomains like `admin.regulr.in` or customer storefronts.
   - NextAuth allows configuring the domain attribute of session cookies via its `cookies` configuration block.
   - We must set the domain to `.regulr.in` (production) or `.localhost` (development) with a leading dot.
   - Because `localhost` uses HTTP and `regulr.in` uses HTTPS, the cookie prefix (`__Secure-` vs none) and `secure` flag must dynamically adjust based on the current request protocol or the `NEXTAUTH_URL` configuration.

5. **Prisma Repository Pattern Constraints**:
   - The project mandates that "Direct Prisma client imports in application components are strictly forbidden. All queries must go through repositories."
   - If NextAuth uses the standard `PrismaAdapter`, it runs direct database operations via `db` or `prisma` inside the API route.
   - **Solution**: Instead of a database adapter, we use a `CredentialsProvider` that queries a newly defined `userRepository` (`src/lib/repositories/user.ts`) to fetch users, ensuring we adhere to the repository boundary constraint.

---

## 3. Caveats
- **Subdomain Local Development**: Testing subdomain routing locally requires using subdomains of `localhost` (e.g. `app.localhost:3000`, `admin.localhost:3000`). Browsers like Chrome/Firefox support this out of the box, but some local network/DNS setups might need configuration or tools like `dnsmasq` or hosts file overrides.
- **Port Handling in Cookies**: NextAuth cookie options do not contain ports; cookies are domain-bound. If local dev runs on a non-standard port, it will still work perfectly with `.localhost`.
- **OAuth Providers Support**: The proposed setup uses `CredentialsProvider` and a JWT strategy. If social login providers (Google/GitHub) are added later, an adapter might be desired. If so, a customized adapter wrapping the repository layer must be used to preserve the architectural constraint.

---

## 4. Conclusion
We have generated draft replacement files proposing the exact code adjustments for Milestone 1. These proposed files are saved in the agent's workspace folder:
1. `proposed_middleware.ts` (replaces `src/middleware.ts`): Implements dynamic root domain extraction, NextAuth token verification, role-based protection guards for `app`/`admin` subdomains, redirect loop bypasses, and request header propagation of the tenant slug.
2. `proposed_auth.ts` (saved as `src/lib/auth.ts`): Configures NextAuth.js with wildcard cookie settings (`.localhost` or `.regulr.in`), `jwt` and `session` callbacks mapping user roles/IDs, and authorization checks.
3. `proposed_nextauth_route.ts` (saved as `src/app/api/auth/[...nextauth]/route.ts`): The API endpoint router initialization.
4. `proposed_user_repository.ts` (saved as `src/lib/repositories/user.ts`): Standard repository for user database access.

---

## 5. Verification Method

To verify these changes independently:

1. **Verify Middleware Routing Override**:
   - Start the server: `npm run dev`.
   - Send requests with `__cafe` query override:
     - `http://localhost:3000/?__cafe=starbucks` -> Check if it routes internally to `/(store)/starbucks`.
     - `http://localhost:3000/?__cafe=app` -> Check if it routes internally to `/(app)/app` (and triggers the login redirect if not authenticated).
   - Send requests with host headers (using curl or Postman):
     - `curl -H "Host: app.localhost:3000" http://localhost:3000/` -> Check if it responds with a redirect to `/login` (auth guard active).
     - `curl -H "Host: starbucks.localhost:3000" http://localhost:3000/` -> Check if it rewrites to storefront without redirecting (public).

2. **Verify Cookie Sharing**:
   - Authenticate on `http://app.localhost:3000/login`.
   - Open browser developer tools and check the Cookies tab:
     - Verify that the cookie `next-auth.session-token` has the domain attribute set to `.localhost`.
   - Navigate to `http://admin.localhost:3000/` or `http://starbucks.localhost:3000/`.
   - Verify that the session token is sent in the request headers and the user remains logged in across these subdomains.
