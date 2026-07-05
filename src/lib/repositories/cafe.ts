import { Cafe } from "@prisma/client";
import { db } from "../db";

export async function getBySlug(slug: string): Promise<Cafe | null> {
  return db.cafe.findUnique({ where: { slug } });
}

export async function getById(id: string): Promise<Cafe | null> {
  return db.cafe.findUnique({ where: { id } });
}

export async function list(): Promise<Cafe[]> {
  return db.cafe.findMany({ orderBy: { createdAt: "desc" } });
}

// Original demo owners predate the User.cafeId link — map them by email domain.
const LEGACY_OWNER_DOMAIN_TO_SLUG: Record<string, string> = {
  "brewhaven.com": "brew-haven",
  "chaipoint.com": "chai-point",
  "espressolab.com": "espresso-lab",
};

export async function resolveCafeForSession(session: any, requestSlug?: string | null): Promise<Cafe | null> {
  const user = session?.user as { id?: string; email?: string; role?: string } | undefined;

  // Owners/staff are strictly scoped to their own cafe — never fall through to
  // another cafe, to avoid cross-tenant data exposure.
  if (user?.role === "OWNER" || user?.role === "STAFF") {
    if (user.id) {
      const dbUser = await db.user.findUnique({ where: { id: user.id } });
      if (dbUser?.cafeId) {
        return db.cafe.findUnique({ where: { id: dbUser.cafeId } });
      }
    }
    if (user.email) {
      const slug = LEGACY_OWNER_DOMAIN_TO_SLUG[user.email.split("@")[1]];
      if (slug) return db.cafe.findUnique({ where: { slug } });
    }
    return null;
  }

  // Superadmin can act on any cafe: the cafe they're impersonating, else the
  // explicitly requested slug, else the first cafe.
  if (user?.role === "SUPERADMIN") {
    const lastImpersonate = await db.auditLog.findFirst({
      where: { actorId: user.id || "unknown" },
      orderBy: { createdAt: "desc" },
    });
    if (lastImpersonate?.action === "IMPERSONATE_START" && lastImpersonate.targetId) {
      const impersonated = await db.cafe.findUnique({ where: { id: lastImpersonate.targetId } });
      if (impersonated) return impersonated;
    }
    if (requestSlug) {
      const bySlug = await db.cafe.findUnique({ where: { slug: requestSlug } });
      if (bySlug) return bySlug;
    }
    return db.cafe.findFirst();
  }

  // Public/unauthenticated callers only get what they explicitly ask for.
  if (requestSlug) {
    return db.cafe.findUnique({ where: { slug: requestSlug } });
  }
  return null;
}
