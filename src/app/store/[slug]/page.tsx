import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getBySlug } from '@/lib/repositories/cafe';
import { listBySlug } from '@/lib/repositories/menuItem';
import * as customerRepo from '@/lib/repositories/customer';
import * as referralRepo from '@/lib/repositories/referral';
import { TIER_THRESHOLDS, nextTier, tierForPoints, REFERRAL_REFERRER_BONUS, REFERRAL_REFERRED_BONUS } from '@/lib/loyalty';
import { referralCodeForCustomer } from '@/lib/repositories/referralCode';
import StorefrontClient from './StorefrontClient';

export default async function StorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cafe = await getBySlug(slug);

  if (!cafe) {
    notFound();
  }

  const menuItems = await listBySlug(slug);
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;

  let loyalty = {
    isGuest: true,
    points: 0,
    tier: 'BRONZE',
    streakCount: 0,
    rewardsAvailable: 0,
    progressPercent: 0,
    pointsToNextTier: TIER_THRESHOLDS.SILVER,
    nextTier: 'SILVER',
  };
  let referral = {
    referralCode: null as string | null,
    referredCount: 0,
    pointsEarnedFromReferrals: 0,
  };

  if (sessionUser?.id && sessionUser.role === 'CUSTOMER') {
    const customer = await customerRepo.getByUserId(cafe.id, sessionUser.id);
    if (customer) {
      const tier = tierForPoints(customer.points);
      const next = nextTier(tier);
      const currentThreshold = TIER_THRESHOLDS[tier] ?? 0;
      const nextThreshold = next ? TIER_THRESHOLDS[next.tier] : customer.points || 1;
      const span = Math.max(1, nextThreshold - currentThreshold);
      const progress = next
        ? Math.min(100, Math.round(((customer.points - currentThreshold) / span) * 100))
        : 100;

      loyalty = {
        isGuest: false,
        points: customer.points,
        tier,
        streakCount: customer.streakCount,
        rewardsAvailable: Math.floor(customer.points / 100),
        progressPercent: progress,
        pointsToNextTier: next ? Math.max(0, next.pointsNeeded - customer.points) : 0,
        nextTier: next?.tier ?? tier,
      };

      const referrals = await referralRepo.list(cafe.id);
      const mine = referrals.filter((r) => r.referrerId === customer.id);
      referral = {
        referralCode: referralCodeForCustomer(customer.id),
        referredCount: mine.length,
        pointsEarnedFromReferrals: mine
          .filter((r) => r.status === 'COMPLETED')
          .reduce((sum, r) => sum + r.pointsAwarded, 0),
      };
    }
  }

  return (
    <StorefrontClient
      cafe={cafe}
      menuItems={menuItems}
      loyalty={loyalty}
      referral={referral}
      isSignedIn={!!sessionUser?.id}
      referrerBonus={REFERRAL_REFERRER_BONUS}
      referredBonus={REFERRAL_REFERRED_BONUS}
    />
  );
}
