import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as customerRepo from "@/lib/repositories/customer";
import { requireCafe } from "@/lib/apiAuth";
import { tierForPoints } from "@/lib/loyalty";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  const auth = await requireCafe(slug);
  if ("error" in auth) return auth.error;

  const customers = await customerRepo.list(auth.cafe.id);
  return NextResponse.json(customers);
}

// Owner/staff adjusts a customer's points. Supports an absolute `points` set or
// an atomic `pointsDelta`. Tier is always derived from the resulting points so
// it can never drift out of sync. The cafe is taken from the session, never the body.
export async function PATCH(request: NextRequest) {
  const auth = await requireCafe();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const { customerId, points, pointsDelta } = body;
  if (!customerId) {
    return NextResponse.json({ error: "customerId required" }, { status: 400 });
  }

  const customer = await customerRepo.getById(auth.cafe.id, customerId);
  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  let nextPoints = customer.points;
  if (pointsDelta != null) {
    // Atomic increment so concurrent grants don't clobber each other.
    const updated = await db.customer.update({
      where: { id: customer.id },
      data: { points: { increment: Math.round(Number(pointsDelta)) || 0 } },
    });
    nextPoints = Math.max(0, updated.points);
  } else if (points != null) {
    nextPoints = Math.max(0, Math.round(Number(points)) || 0);
    await db.customer.update({ where: { id: customer.id }, data: { points: nextPoints } });
  }

  const final = await db.customer.update({
    where: { id: customer.id },
    data: { points: nextPoints, tier: tierForPoints(nextPoints) },
    include: { user: true },
  });
  return NextResponse.json(final);
}
