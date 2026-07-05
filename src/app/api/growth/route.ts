import { NextRequest, NextResponse } from "next/server";


const DEFAULT_SETTINGS = {
  loyaltyEnabled: true,
  pointsPerRupee: 1,
  streakMilestones: [3, 7, 14, 30],
  coupons: [{ code: "WELCOME10", discountPaise: 1000, maxUses: 100 }],
};

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

import { resolveCafeForSession } from "@/lib/repositories/cafe";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const slug = request.nextUrl.searchParams.get("slug");
  const cafe = await resolveCafeForSession(session, slug);

  if (!cafe) return NextResponse.json({ error: "Cafe not found" }, { status: 404 });
  return NextResponse.json({ cafeId: cafe.id, ...DEFAULT_SETTINGS });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ ...DEFAULT_SETTINGS, ...body, saved: true });
}
