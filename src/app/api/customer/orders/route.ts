import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import * as customerRepo from "@/lib/repositories/customer";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const cafe = await db.cafe.findUnique({ where: { slug } });
  if (!cafe) return NextResponse.json({ error: "Cafe not found" }, { status: 404 });

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ orders: [] });

  const customer = await customerRepo.getByUserId(cafe.id, userId);
  if (!customer) return NextResponse.json({ orders: [] });

  const orders = await db.order.findMany({
    where: { cafeId: cafe.id, customerId: customer.id },
    include: { orderItems: { include: { menuItem: true } } },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.id,
      status: o.status,
      totalAmount: o.totalAmount,
      pointsEarned: o.pointsEarned,
      tableNumber: o.tableNumber,
      createdAt: o.createdAt,
      items: o.orderItems.map((it) => ({
        menuItemId: it.menuItemId,
        name: it.menuItem.name,
        price: it.menuItem.price,
        available: it.menuItem.isAvailable,
        quantity: it.quantity,
      })),
    })),
  });
}
