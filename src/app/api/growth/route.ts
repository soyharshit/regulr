import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveCafeForSession } from "@/lib/repositories/cafe";
import * as cafeSettingsRepo from "@/lib/repositories/cafeSettings";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const slug = request.nextUrl.searchParams.get("slug");
  const cafe = await resolveCafeForSession(session, slug);

  if (!cafe) return NextResponse.json({ error: "Cafe not found" }, { status: 404 });

  const settings = await cafeSettingsRepo.getByCafeId(cafe.id);
  return NextResponse.json({ cafeId: cafe.id, ...settings });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const body = await request.json();
  const slug = request.nextUrl.searchParams.get("slug");
  const cafe = await resolveCafeForSession(session, slug || body.slug);

  if (!cafe) return NextResponse.json({ error: "Cafe not found" }, { status: 404 });

  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || (role !== "OWNER" && role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { loyaltyEnabled, pointsPerRupee, streakMilestones, coupons } = body;
  const saved = await cafeSettingsRepo.upsert(cafe.id, {
    loyaltyEnabled,
    pointsPerRupee,
    streakMilestones,
    coupons,
  });

  return NextResponse.json({ cafeId: cafe.id, ...saved, saved: true });
}
