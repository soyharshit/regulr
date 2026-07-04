import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const MONTHLY_PLAN_AMOUNT = 500000;

function startOfDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - (days - 1));
  date.setHours(0, 0, 0, 0);
  return date;
}

function timeAgo(date: Date | null) {
  if (!date) return "No activity";
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export async function GET() {
  const sevenDaysAgo = startOfDaysAgo(7);
  const thirtyDaysAgo = startOfDaysAgo(30);

  const cafes = await db.cafe.findMany({
    include: {
      orders: {
        where: { createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const activeCafes = cafes.filter((cafe) => cafe.orders.length > 0);
  const orders30d = cafes.flatMap((cafe) => cafe.orders);
  const orders7dByCafe = new Map(
    cafes.map((cafe) => [
      cafe.id,
      cafe.orders.filter((order) => order.createdAt >= sevenDaysAgo).length,
    ])
  );

  const gmv30d = orders30d.reduce((sum, order) => sum + order.totalAmount, 0);

  return NextResponse.json({
    stats: {
      totalCafes: cafes.length,
      activeCafes: activeCafes.length,
      mrr: activeCafes.length * MONTHLY_PLAN_AMOUNT,
      churn30d: cafes.length === 0 ? 0 : Math.round(((cafes.length - activeCafes.length) / cafes.length) * 1000) / 10,
      gmv30d,
      gameEngagement: 0,
    },
    cafes: cafes.map((cafe) => {
      const orders7d = orders7dByCafe.get(cafe.id) || 0;
      return {
        name: cafe.name,
        slug: cafe.slug,
        city: "Unassigned",
        plan: "Growth",
        mrr: orders7d > 0 ? MONTHLY_PLAN_AMOUNT : 0,
        lastActivity: timeAgo(cafe.orders[0]?.createdAt || null),
        orders7d,
        status: orders7d > 0 ? "active" : "trial",
      };
    }),
  });
}
