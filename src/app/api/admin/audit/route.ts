import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSuperadmin } from "@/lib/apiAuth";

export async function GET() {
  const auth = await requireSuperadmin();
  if ("error" in auth) return auth.error;

  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(
    logs.map((log) => ({
      id: log.id,
      actorId: log.actorId,
      targetId: log.targetId,
      action: log.action,
      metadata: log.metadata,
      createdAt: log.createdAt,
    }))
  );
}
