import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import * as customerRepo from "@/lib/repositories/customer";

const DAILY_REWARDS = [2, 3, 4, 5, 6, 7];
const MILESTONE_REWARDS: Record<number, number> = { 7: 25, 14: 50, 21: 75, 30: 150 };

function getRewardForDay(streakDay: number): number {
  if (MILESTONE_REWARDS[streakDay]) return MILESTONE_REWARDS[streakDay];
  return DAILY_REWARDS[Math.min(streakDay - 1, DAILY_REWARDS.length - 1)] || 2;
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const cafe = await db.cafe.findUnique({ where: { slug } });
  if (!cafe) return NextResponse.json({ error: "Cafe not found" }, { status: 404 });

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ checkedInToday: false, streak: 0, todayReward: 2 });

  const customer = await customerRepo.getByUserId(cafe.id, userId);
  if (!customer) return NextResponse.json({ checkedInToday: false, streak: 0, todayReward: 2 });

  const today = new Date().toISOString().slice(0, 10);
  const todayCheckIn = await db.checkIn.findUnique({
    where: { customerId_date: { customerId: customer.id, date: today } },
  });

  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const dateStr = d.toISOString().slice(0, 10);
    const exists = await db.checkIn.findUnique({
      where: { customerId_date: { customerId: customer.id, date: dateStr } },
    });
    if (exists) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  return NextResponse.json({
    checkedInToday: !!todayCheckIn,
    streak,
    todayReward: getRewardForDay(streak + 1),
    lastCheckIn: todayCheckIn?.date || null,
  });
}

export async function POST(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const cafe = await db.cafe.findUnique({ where: { slug } });
  if (!cafe) return NextResponse.json({ error: "Cafe not found" }, { status: 404 });

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Sign in to check in" }, { status: 401 });

  const customer = await customerRepo.getByUserId(cafe.id, userId);
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const today = new Date().toISOString().slice(0, 10);

  const existing = await db.checkIn.findUnique({
    where: { customerId_date: { customerId: customer.id, date: today } },
  });
  if (existing) return NextResponse.json({ points: existing.points, alreadyCheckedIn: true });

  let streak = 0;
  const d = new Date();
  d.setDate(d.getDate() - 1);
  for (let i = 0; i < 365; i++) {
    const dateStr = d.toISOString().slice(0, 10);
    const exists = await db.checkIn.findUnique({
      where: { customerId_date: { customerId: customer.id, date: dateStr } },
    });
    if (exists) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  const todayReward = getRewardForDay(streak + 1);

  await db.checkIn.create({
    data: { cafeId: cafe.id, customerId: customer.id, date: today, points: todayReward },
  });
  const updated = await db.customer.update({
    where: { id: customer.id },
    data: { points: { increment: todayReward } },
  });

  // Initialize Fortune Box if customer doesn't have one yet.
  const existingBox = await db.fortuneBox.findUnique({
    where: { cafeId_customerId: { cafeId: cafe.id, customerId: customer.id } },
  });
  if (!existingBox) {
    await db.fortuneBox.create({
      data: { cafeId: cafe.id, customerId: customer.id },
    });
  }

  return NextResponse.json({
    points: todayReward,
    alreadyCheckedIn: false,
    totalPoints: updated.points,
    newStreak: streak + 1,
  });
}
