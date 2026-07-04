import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import * as customerRepo from "@/lib/repositories/customer";

const TIER_THRESHOLDS: Record<string, number> = {
  BRONZE: 0,
  SILVER: 200,
  GOLD: 500,
  PLATINUM: 1000,
};

function nextTier(current: string): { tier: string; pointsNeeded: number } | null {
  const order = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];
  const idx = order.indexOf(current);
  if (idx < 0 || idx >= order.length - 1) return null;
  return { tier: order[idx + 1], pointsNeeded: TIER_THRESHOLDS[order[idx + 1]] };
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const cafe = await db.cafe.findUnique({ where: { slug } });
  if (!cafe) return NextResponse.json({ error: "Cafe not found" }, { status: 404 });

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({
      streakCount: 0,
      points: 0,
      tier: "BRONZE",
      rewardsAvailable: 0,
      progressPercent: 0,
      pointsToNextTier: 200,
      nextTier: "SILVER",
      isGuest: true,
    });
  }

  const customer = await customerRepo.getByUserId(cafe.id, userId);
  if (!customer) {
    return NextResponse.json({
      streakCount: 0,
      points: 0,
      tier: "BRONZE",
      rewardsAvailable: 0,
      progressPercent: 0,
      pointsToNextTier: 200,
      nextTier: "SILVER",
      isGuest: true,
    });
  }

  const next = nextTier(customer.tier);
  const currentThreshold = TIER_THRESHOLDS[customer.tier] ?? 0;
  const nextThreshold = next ? TIER_THRESHOLDS[next.tier] : customer.points || 1;
  const span = Math.max(1, nextThreshold - currentThreshold);
  const progress = next
    ? Math.min(100, Math.round(((customer.points - currentThreshold) / span) * 100))
    : 100;

  return NextResponse.json({
    streakCount: customer.streakCount,
    points: customer.points,
    tier: customer.tier,
    rewardsAvailable: Math.floor(customer.points / 100),
    progressPercent: progress,
    pointsToNextTier: next ? Math.max(0, next.pointsNeeded - customer.points) : 0,
    nextTier: next?.tier ?? customer.tier,
    isGuest: false,
  });
}
