import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get("host") || "";

  // 1. Exclude static assets, Next.js internal paths, and API routes
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/favicon.ico") ||
    url.pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Resolve port and determine subdomain
  let hostname = host;
  if (hostname.includes(":")) {
    hostname = hostname.split(":")[0];
  }

  const cafeOverride = url.searchParams.get("__cafe");
  
  // Retrieve the configured root domain or fallback to "regulr.in"
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "regulr.in";
  
  let subdomain = "";
  if (hostname.endsWith(`.${rootDomain}`)) {
    subdomain = hostname.slice(0, -(rootDomain.length + 1));
  } else if (hostname.endsWith(".localhost")) {
    subdomain = hostname.slice(0, -10);
  }

  // Override takes precedence for testing/development flexibility
  const tenantSlug = cafeOverride || subdomain;

  // 3. Auth Guard Checks (app and admin subdomains are protected)
  if (tenantSlug === "app" || tenantSlug === "admin") {
    // Exclude auth-related pages from redirect loop
    const isAuthPage =
      url.pathname === "/login" ||
      url.pathname === "/signup" ||
      url.pathname.startsWith("/auth");

    if (!isAuthPage) {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      // Redirect unauthenticated requests to login page
      if (!token) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", request.url);
        return NextResponse.redirect(loginUrl);
      }

      // Role-based access validation
      const userRole = (token.role as string) || "CUSTOMER";

      if (tenantSlug === "admin" && userRole !== "SUPERADMIN") {
        return new NextResponse("Forbidden: Superadmin access required", { status: 403 });
      }

      if (
        tenantSlug === "app" &&
        !["OWNER", "STAFF", "SUPERADMIN"].includes(userRole)
      ) {
        return new NextResponse("Forbidden: Owner or Staff access required", { status: 403 });
      }
    }
  }

  // 4. Context propagation: Inject tenantSlug into headers for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-slug", tenantSlug || "");

  // 5. Route rewriting
  if (tenantSlug) {
    if (tenantSlug === "app") {
      url.pathname = `/(app)/app${url.pathname}`;
      return NextResponse.rewrite(url, {
        request: {
          headers: requestHeaders,
        },
      });
    } else if (tenantSlug === "admin") {
      url.pathname = `/(admin)/admin${url.pathname}`;
      return NextResponse.rewrite(url, {
        request: {
          headers: requestHeaders,
        },
      });
    } else if (tenantSlug !== "www") {
      // Dynamic customer storefront routing
      url.pathname = `/(store)/${tenantSlug}${url.pathname}`;
      return NextResponse.rewrite(url, {
        request: {
          headers: requestHeaders,
        },
      });
    }
  }

  // Fallback: marketing page routing
  url.pathname = `/(marketing)/marketing${url.pathname}`;
  return NextResponse.rewrite(url, {
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    // Apply middleware to all routes except API, static assets, and icon files
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
