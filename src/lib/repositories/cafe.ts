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

export async function resolveCafeForSession(session: any, requestSlug?: string | null): Promise<Cafe | null> {
  const user = session?.user as { id?: string; email?: string; role?: string } | undefined;
  let cafe: Cafe | null = null;

  if (user?.role === "SUPERADMIN") {
    // Look up last impersonation
    const lastImpersonate = await db.auditLog.findFirst({
      where: { actorId: user.id || "unknown" },
      orderBy: { createdAt: "desc" },
    });
    if (lastImpersonate && lastImpersonate.action === "IMPERSONATE_START" && lastImpersonate.targetId) {
      cafe = await db.cafe.findUnique({ where: { id: lastImpersonate.targetId } });
    }
  } else if (user?.role === "OWNER" && user.email) {
    // Map email domain to slug
    const emailDomain = user.email.split('@')[1];
    const domainToSlug: Record<string, string> = {
      "brewhaven.com": "brew-haven",
      "chaipoint.com": "chai-point",
      "espressolab.com": "espresso-lab",
    };
    const slug = domainToSlug[emailDomain];
    if (slug) {
      cafe = await db.cafe.findUnique({ where: { slug } });
    }
  }

  // Fallback to slug parameter or first cafe
  if (!cafe && requestSlug) {
    cafe = await db.cafe.findUnique({ where: { slug: requestSlug } });
  }

  if (!cafe) {
    cafe = await db.cafe.findFirst();
  }

  return cafe;
}
