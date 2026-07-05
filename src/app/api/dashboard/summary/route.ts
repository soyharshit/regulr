import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function startDateForRange(range: string) {
  const now = new Date();
  const days = range === "30d" ? 30 : range === "7d" ? 7 : 1;
  const start = new Date(now);
  start.setDate(now.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);
  return start;
}

function timeAgo(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { resolveCafeForSession } from "@/lib/repositories/cafe";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const slug = request.nextUrl.searchParams.get("slug");
  const cafe = await resolveCafeForSession(session, slug);

  const range = request.nextUrl.searchParams.get("range") || "today";
  const startDate = startDateForRange(range);
  if (!cafe) {
    return NextResponse.json({ error: "Cafe not found" }, { status: 404 });
  }

  const [orders, customers] = await Promise.all([
    db.order.findMany({
      where: {
        cafeId: cafe.id,
        createdAt: { gte: startDate },
      },
      include: {
        orderItems: { include: { menuItem: true } },
        customer: { include: { user: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.customer.findMany({
      where: { cafeId: cafe.id },
      include: { orders: true },
    }),
  ]);

  const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const repeatCustomers = customers.filter((customer) => customer.orders.length > 1).length;
  const customersWithOrders = customers.filter((customer) => customer.orders.length > 0).length;
  const repeatRate = customersWithOrders === 0 ? 0 : Math.round((repeatCustomers / customersWithOrders) * 100);
  const activeStreaks = customers.filter((customer) => customer.streakCount > 0).length;
  const newCustomers = customers.filter((customer) => customer.createdAt >= startDate).length;

  const itemCounts = new Map<string, { name: string; count: number }>();
  for (const order of orders) {
    for (const item of order.orderItems) {
      const key = item.menuItemId;
      const existing = itemCounts.get(key);
      itemCounts.set(key, {
        name: item.menuItem.name,
        count: (existing?.count || 0) + item.quantity,
      });
    }
  }

  const topItems = Array.from(itemCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  const maxTopItemCount = topItems[0]?.count || 1;

  const chartDays = range === "today" ? 7 : range === "7d" ? 7 : 30;
  const chartStart = startDateForRange(`${chartDays}d`);
  const chartOrders = await db.order.findMany({
    where: { cafeId: cafe.id, createdAt: { gte: chartStart } },
    orderBy: { createdAt: "asc" },
  });
  const revenueByDay = new Map<string, number>();
  for (const order of chartOrders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    revenueByDay.set(key, (revenueByDay.get(key) || 0) + order.totalAmount);
  }
  const chartData = Array.from(revenueByDay.entries()).map(([date, amount]) => ({
    date,
    revenue: amount / 100,
  }));

  const isImpersonating = session?.user && (session.user as { role?: string }).role === "SUPERADMIN";

  return NextResponse.json({
    cafe,
    isImpersonating,
    stats: {
      orders: orders.length,
      revenue,
      commissionSaved: Math.round(revenue * 0.25),
      repeatRate,
      activeStreaks,
      newCustomers,
    },
    recentOrders: orders.slice(0, 5).map((order) => ({
      id: order.id.slice(0, 8),
      items: order.orderItems
        .map((item) => `${item.menuItem.name} x${item.quantity}`)
        .join(", "),
      type: "Pickup",
      amount: order.totalAmount,
      status: order.status,
      customer: order.customer?.user.name || "Walk-in",
      tier: order.customer?.tier || "BRONZE",
      timeAgo: timeAgo(order.createdAt),
    })),
    topItems: topItems.map((item) => ({
      ...item,
      percent: Math.round((item.count / maxTopItemCount) * 100),
    })),
    chartData,
  });
}
