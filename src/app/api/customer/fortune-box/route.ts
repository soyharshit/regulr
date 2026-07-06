import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import * as customerRepo from "@/lib/repositories/customer";

const REWARD_POOL = [
  { type: "points", value: 20 },
  { type: "points", value: 30 },
  { type: "points", value: 50 },
  { type: "points", value: 75 },
  { type: "points", value: 100 },
  { type: "coupon", value: 5 },
  { type: "coupon", value: 10 },
  { type: "coupon", value: 15 },
  { type: "points", value: 200 },
];

function pickReward() {
  const r = Math.random();
  if (r < 0.70) return REWARD_POOL[Math.floor(Math.random() * 3)];
  if (r < 0.95) return REWARD_POOL[3 + Math.floor(Math.random() * 3)];
  return REWARD_POOL[6 + Math.floor(Math.random() * 3)];
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const cafe = await db.cafe.findUnique({ where: { slug } });
  if (!cafe) return NextResponse.json({ error: "Cafe not found" }, { status: 404 });

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ progress: 0, canOpen: false, reward: null });

  const customer = await customerRepo.getByUserId(cafe.id, userId);
  if (!customer) return NextResponse.json({ progress: 0, canOpen: false, reward: null });

  let box = await db.fortuneBox.findUnique({ where: { cafeId_customerId: { cafeId: cafe.id, customerId: customer.id } } });
  if (!box) {
    box = await db.fortuneBox.create({ data: { cafeId: cafe.id, customerId: customer.id, progress: 0 } });
  }

  let parsedReward = null;
  if (box.reward) {
    try { parsedReward = JSON.parse(box.reward); } catch { parsedReward = null; }
  }

  return NextResponse.json({
    progress: box.progress,
    canOpen: box.progress >= 5 && !box.openedAt,
    reward: box.openedAt ? parsedReward : null,
    openedAt: box.openedAt?.toISOString() || null,
  });
}

export async function POST(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

  const cafe = await db.cafe.findUnique({ where: { slug } });
  if (!cafe) return NextResponse.json({ error: "Cafe not found" }, { status: 404 });

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Sign in" }, { status: 401 });

  const customer = await customerRepo.getByUserId(cafe.id, userId);
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const box = await db.fortuneBox.findUnique({ where: { cafeId_customerId: { cafeId: cafe.id, customerId: customer.id } } });
  if (!box || box.progress < 5 || box.openedAt) {
    return NextResponse.json({ error: "Box not ready to open" }, { status: 400 });
  }

  const reward = pickReward();
  await db.fortuneBox.update({
    where: { id: box.id },
    data: { reward: JSON.stringify(reward), openedAt: new Date() },
  });

  if (reward.type === "points") {
    await db.customer.update({ where: { id: customer.id }, data: { points: { increment: reward.value } } });
  }

  await db.fortuneBox.create({ data: { cafeId: cafe.id, customerId: customer.id, progress: 0 } });

  return NextResponse.json({ reward, openedAt: new Date().toISOString() });
}
