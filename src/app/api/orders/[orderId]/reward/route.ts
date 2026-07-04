import { NextRequest, NextResponse } from "next/server";
import * as orderRepo from "@/lib/repositories/order";
import * as customerRepo from "@/lib/repositories/customer";

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const body = await request.json();
    const { cafeId, points = 25 } = body;

    if (!cafeId) {
      return NextResponse.json({ error: "cafeId required" }, { status: 400 });
    }

    const order = await orderRepo.getById(cafeId, params.orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.customerId) {
      const customer = await customerRepo.getById(cafeId, order.customerId);
      if (customer) {
        await customerRepo.updatePoints(cafeId, customer.id, customer.points + points);
      }
    }

    return NextResponse.json({ awarded: points });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
