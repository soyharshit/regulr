import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

function requireSuperadmin(session: unknown): boolean {
  const role = (session as { user?: { role?: string } } | null)?.user?.role;
  return role === "SUPERADMIN";
}

function generateTempPassword(): string {
  return randomBytes(6).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 9) + "1";
}

// Rename / activate / deactivate a cafe.
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!requireSuperadmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { slug, name, isActive } = body;
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const cafe = await db.cafe.findUnique({ where: { slug } });
  if (!cafe) return NextResponse.json({ error: "Cafe not found" }, { status: 404 });

  const data: { name?: string; isActive?: boolean } = {};
  if (typeof name === "string" && name.trim()) data.name = name.trim();
  if (typeof isActive === "boolean") data.isActive = isActive;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await db.cafe.update({ where: { id: cafe.id }, data });

  await db.auditLog.create({
    data: {
      actorId: (session!.user as { id?: string }).id || "unknown",
      targetId: cafe.id,
      action: "CAFE_UPDATED",
      metadata: JSON.stringify({ slug, ...data }),
    },
  });

  return NextResponse.json({ slug: updated.slug, name: updated.name, isActive: updated.isActive });
}

// Reset (or create) the owner login for a cafe, returning a fresh temp password.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!requireSuperadmin(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { slug, action } = body;
  if (action !== "reset-owner-password") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const cafe = await db.cafe.findUnique({ where: { slug } });
  if (!cafe) return NextResponse.json({ error: "Cafe not found" }, { status: 404 });

  const owner = await db.user.findFirst({ where: { cafeId: cafe.id, role: "OWNER" } });
  if (!owner) {
    return NextResponse.json(
      { error: "This cafe has no owner account yet. Re-onboard it with an owner email." },
      { status: 404 }
    );
  }

  const tempPassword = generateTempPassword();
  const hashed = await bcrypt.hash(tempPassword, 10);
  await db.user.update({ where: { id: owner.id }, data: { password: hashed } });

  await db.auditLog.create({
    data: {
      actorId: (session!.user as { id?: string }).id || "unknown",
      targetId: cafe.id,
      action: "OWNER_PASSWORD_RESET",
      metadata: JSON.stringify({ slug, ownerEmail: owner.email }),
    },
  });

  return NextResponse.json({ email: owner.email, tempPassword });
}
