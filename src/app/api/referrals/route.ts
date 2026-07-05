import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveCafeForSession } from "@/lib/repositories/cafe";
import * as customerRepo from "@/lib/repositories/customer";
import * as referralRepo from "@/lib/repositories/referral";
import { referralCodeForCustomer, findCustomerByReferralCode } from "@/lib/repositories/referralCode";
import { REFERRAL_REFERRER_BONUS, REFERRAL_REFERRED_BONUS } from "@/lib/loyalty";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;
  const slug = request.nextUrl.searchParams.get("slug");

  // Owner/superadmin view: cafe-wide referral program stats.
  if (sessionUser?.role === "OWNER" || sessionUser?.role === "SUPERADMIN") {
    const cafe = await resolveCafeForSession(session, slug);
    if (!cafe) return NextResponse.json({ error: "Cafe not found" }, { status: 404 });

    const referrals = await referralRepo.list(cafe.id);
    const completed = referrals.filter((r) => r.status === "COMPLETED");
    return NextResponse.json({
      scope: "cafe",
      totalReferrals: referrals.length,
      completedReferrals: completed.length,
      pendingReferrals: referrals.length - completed.length,
      totalPointsPaid: completed.reduce((sum, r) => sum + r.pointsAwarded, 0),
      recent: referrals.slice(0, 10).map((r) => ({
        referrer: r.referrer.user.name || r.referrer.user.email,
        referred: r.referred.user.name || r.referred.user.email,
        status: r.status,
        pointsAwarded: r.pointsAwarded,
        createdAt: r.createdAt,
      })),
    });
  }

  // Customer view: my own referral code + how many people I've referred.
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
  const cafe = await db.cafe.findUnique({ where: { slug } });
  if (!cafe) return NextResponse.json({ error: "Cafe not found" }, { status: 404 });

  if (!sessionUser?.id) {
    return NextResponse.json({ scope: "guest", referralCode: null, referredCount: 0, pointsEarnedFromReferrals: 0 });
  }

  const customer = await customerRepo.getByUserId(cafe.id, sessionUser.id);
  if (!customer) {
    return NextResponse.json({ scope: "guest", referralCode: null, referredCount: 0, pointsEarnedFromReferrals: 0 });
  }

  const referrals = await referralRepo.list(cafe.id);
  const mine = referrals.filter((r) => r.referrerId === customer.id);
  return NextResponse.json({
    scope: "customer",
    referralCode: referralCodeForCustomer(customer.id),
    referredCount: mine.length,
    pointsEarnedFromReferrals: mine.filter((r) => r.status === "COMPLETED").reduce((sum, r) => sum + r.pointsAwarded, 0),
    referrerBonus: REFERRAL_REFERRER_BONUS,
    referredBonus: REFERRAL_REFERRED_BONUS,
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;
  if (!sessionUser?.id) {
    return NextResponse.json({ error: "Sign in to redeem a referral code" }, { status: 401 });
  }

  const body = await request.json();
  const { slug, code } = body;
  if (!slug || !code) {
    return NextResponse.json({ error: "slug and code are required" }, { status: 400 });
  }

  const cafe = await db.cafe.findUnique({ where: { slug } });
  if (!cafe) return NextResponse.json({ error: "Cafe not found" }, { status: 404 });

  const referredCustomer = await customerRepo.findOrCreateForUser(cafe.id, sessionUser.id);

  const alreadyReferred = await db.referral.findUnique({ where: { referredId: referredCustomer.id } });
  if (alreadyReferred) {
    return NextResponse.json({ error: "You have already used a referral code here" }, { status: 400 });
  }

  const referrer = await findCustomerByReferralCode(cafe.id, code);
  if (!referrer) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });
  }
  if (referrer.id === referredCustomer.id) {
    return NextResponse.json({ error: "You can't refer yourself" }, { status: 400 });
  }

  const referral = await referralRepo.create(cafe.id, referrer.id, referredCustomer.id);
  return NextResponse.json({
    ok: true,
    status: referral.status,
    message: "Referral applied — you'll both earn bonus points when you complete your first order.",
  });
}
