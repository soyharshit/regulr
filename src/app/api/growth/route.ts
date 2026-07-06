import { NextRequest, NextResponse } from "next/server";
import * as cafeSettingsRepo from "@/lib/repositories/cafeSettings";
import { requireCafe } from "@/lib/apiAuth";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  const auth = await requireCafe(slug);
  if ("error" in auth) return auth.error;

  const settings = await cafeSettingsRepo.getByCafeId(auth.cafe.id);
  return NextResponse.json({ cafeId: auth.cafe.id, ...settings });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const auth = await requireCafe(body.slug ?? null);
  if ("error" in auth) return auth.error;

  const { loyaltyEnabled, pointsPerRupee, streakMilestones, coupons, rewards } = body;
  const saved = await cafeSettingsRepo.upsert(auth.cafe.id, {
    loyaltyEnabled,
    pointsPerRupee,
    streakMilestones,
    coupons,
    rewards,
  });

  return NextResponse.json({ cafeId: auth.cafe.id, ...saved, saved: true });
}
