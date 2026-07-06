import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN;

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get("host") || "";

  // Redirect logged-in users away from the marketing landing page.
  if (url.pathname === "/" || url.pathname === "/marketing") {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (token?.sub) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Strip port for comparison
  const hostname = host.split(":")[0];

  // Query param override for local dev: ?__cafe=slug
  const cafeOverride = url.searchParams.get("__cafe");

  // Determine subdomain
  let subdomain = "";
  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    subdomain = hostname.replace(`.${ROOT_DOMAIN}`, "");
  } else if (hostname.endsWith(".localhost")) {
    subdomain = hostname.replace(".localhost", "");
  }

  // Shared surfaces resolve to the same routes on EVERY host (root or a cafe
  // subdomain). Without this, /auth/signin on brew-haven.regulr.in gets
  // rewritten to /store/brew-haven/auth/signin and 404s, so a customer can
  // never reach the sign-in form from the storefront.
  if (/^\/(auth)(\/|$)/.test(url.pathname)) {
    return NextResponse.next();
  }

  const tenant = cafeOverride || subdomain;

  // Root domain or www (no tenant subdomain).
  if (!tenant || tenant === "www") {
    // Dev/demo convenience: on a single host (e.g. a preview URL) allow the
    // internal surfaces to be reached directly by path so the whole app is
    // browsable without configuring subdomains. In production these are served
    // via app./admin./{slug}. subdomains instead.
    const directSurface = /^\/(dashboard|admin|store|marketing|auth)(\/|$)/.test(
      url.pathname
    );
    if (directSurface) {
      return NextResponse.next();
    }

    // Everything else at the root → marketing landing.
    url.pathname = `/marketing${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Owner dashboard
  if (tenant === "app") {
    url.pathname = `/dashboard${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Superadmin panel
  if (tenant === "admin") {
    url.pathname = `/admin${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Customer storefront — set cafe slug header
  const response = NextResponse.rewrite(
    new URL(`/store/${tenant}${url.pathname}`, url)
  );
  response.headers.set("x-cafe-slug", tenant);
  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)",
  ],
};
