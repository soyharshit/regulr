import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import * as customerRepo from "@/lib/repositories/customer";
import { TIER_THRESHOLDS, nextTier, tierForPoints } from "@/lib/loyalty";
import { referralCodeForCustomer } from "@/lib/repositories/referralCode";

const GUEST_RESPONSE = {
  streakCount: 0,
  points: 0,
  tier: "BRONZE",
  rewardsAvailable: 0,
  progressPercent: 0,
  pointsToNextTier: 200,
  nextTier: "SILVER",
  isGuest: true,
  referralCode: null as string | null,
};

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const cafe = await db.cafe.findUnique({ where: { slug } });
  if (!cafe) return NextResponse.json({ error: "Cafe not found" }, { status: 404 });

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json(GUEST_RESPONSE);
  }

  const customer = await customerRepo.getByUserId(cafe.id, userId);
  if (!customer) {
    return NextResponse.json(GUEST_RESPONSE);
  }

  // Tier is derived from points so it can never drift out of sync.
  const tier = tierForPoints(customer.points);
  const next = nextTier(tier);
  const currentThreshold = TIER_THRESHOLDS[tier] ?? 0;
  const nextThreshold = next ? TIER_THRESHOLDS[next.tier] : customer.points || 1;
  const span = Math.max(1, nextThreshold - currentThreshold);
  const progress = next
    ? Math.min(100, Math.round(((customer.points - currentThreshold) / span) * 100))
    : 100;

  return NextResponse.json({
    streakCount: customer.streakCount,
    points: customer.points,
    tier,
    rewardsAvailable: Math.floor(customer.points / 100),
    progressPercent: progress,
    pointsToNextTier: next ? Math.max(0, next.pointsNeeded - customer.points) : 0,
    nextTier: next?.tier ?? tier,
    isGuest: false,
    referralCode: referralCodeForCustomer(customer.id),
  });
}
