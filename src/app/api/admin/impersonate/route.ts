import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { targetSlug, actorId } = body;
  if (!targetSlug) {
    return NextResponse.json({ error: "targetSlug required" }, { status: 400 });
  }

  const cafe = await db.cafe.findUnique({ where: { slug: targetSlug } });
  if (!cafe) return NextResponse.json({ error: "Cafe not found" }, { status: 404 });

  await db.auditLog.create({
    data: {
      actorId: actorId || (session.user as { id?: string }).id || "unknown",
      targetId: cafe.id,
      action: "IMPERSONATE_START",
      metadata: JSON.stringify({ slug: targetSlug, cafeName: cafe.name }),
    },
  });

  return NextResponse.json({ slug: targetSlug, cafeName: cafe.name });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.auditLog.create({
    data: {
      actorId: (session.user as { id?: string }).id || "unknown",
      action: "IMPERSONATE_END",
      metadata: "{}",
    },
  });

  return NextResponse.json({ ok: true });
}
