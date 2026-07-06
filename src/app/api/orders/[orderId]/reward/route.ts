import { NextRequest, NextResponse } from "next/server";
import * as orderRepo from "@/lib/repositories/order";
import * as customerRepo from "@/lib/repositories/customer";
import { db } from "@/lib/db";
import { requireCafe } from "@/lib/apiAuth";
import { tierForPoints } from "@/lib/loyalty";

const MAX_MANUAL_REWARD = 500;

// Manual goodwill points grant by owner/staff, scoped to their cafe and clamped.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const auth = await requireCafe();
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json().catch(() => ({}));
    const points = Math.max(0, Math.min(MAX_MANUAL_REWARD, Math.round(Number(body.points)) || 25));

    const order = await orderRepo.getById(auth.cafe.id, orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (!order.customerId) {
      return NextResponse.json({ error: "Order has no customer to reward" }, { status: 400 });
    }

    const customer = await customerRepo.getById(auth.cafe.id, order.customerId);
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const updated = await db.customer.update({
      where: { id: customer.id },
      data: { points: { increment: points } },
    });
    await db.customer.update({
      where: { id: customer.id },
      data: { tier: tierForPoints(updated.points) },
    });

    return NextResponse.json({ awarded: points, points: updated.points });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
