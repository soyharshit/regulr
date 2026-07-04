import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
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
