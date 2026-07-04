import { NextRequest, NextResponse } from "next/server";
import * as customerRepo from "@/lib/repositories/customer";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug") || "brew-haven";
  const cafe = await db.cafe.findUnique({ where: { slug } });
  if (!cafe) return NextResponse.json({ error: "Cafe not found" }, { status: 404 });

  const customers = await customerRepo.list(cafe.id);
  return NextResponse.json(customers);
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { cafeId, customerId, points, tier } = body;
    if (!cafeId || !customerId) {
      return NextResponse.json({ error: "cafeId and customerId required" }, { status: 400 });
    }
    if (points != null) {
      await customerRepo.updatePoints(cafeId, customerId, Number(points));
    }
    if (tier) {
      await customerRepo.updateTier(cafeId, customerId, tier);
    }
    const updated = await customerRepo.getById(cafeId, customerId);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
