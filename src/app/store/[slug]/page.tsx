import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getBySlug } from '@/lib/repositories/cafe';
import { listBySlug } from '@/lib/repositories/menuItem';
import * as customerRepo from '@/lib/repositories/customer';
import * as referralRepo from '@/lib/repositories/referral';
import * as cafeSettingsRepo from '@/lib/repositories/cafeSettings';
import { TIER_THRESHOLDS, nextTier, tierForPoints, REFERRAL_REFERRER_BONUS, REFERRAL_REFERRED_BONUS } from '@/lib/loyalty';
import { referralCodeForCustomer } from '@/lib/repositories/referralCode';
import StorefrontClient from './StorefrontClient';

export default async function StorefrontPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ table?: string }>;
}) {
  const { slug } = await params;
  const { table } = await searchParams;
  const tableNumber = table && /^\d+$/.test(table) ? Number(table) : null;
  const cafe = await getBySlug(slug);

  if (!cafe) {
    notFound();
  }

  if (!cafe.isActive) {
    return (
      <div className="min-h-screen bg-bg-subtle flex items-center justify-center p-6">
        <div className="bg-white rounded-card shadow-card p-8 max-w-sm text-center space-y-2">
          <h1 className="font-display font-bold text-xl text-ink">{cafe.name}</h1>
          <p className="text-sm text-ink-2">This store is temporarily unavailable. Please check back soon.</p>
        </div>
      </div>
    );
  }

  const menuItems = await listBySlug(slug);
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;
  const cafeSettings = await cafeSettingsRepo.getByCafeId(cafe.id);

  let loyalty = {
    isGuest: true,
    points: 0,
    tier: 'BRONZE',
    streakCount: 0,
    streakCalendar: '[]',
    rewardsAvailable: 0,
    progressPercent: 0,
    pointsToNextTier: TIER_THRESHOLDS.SILVER,
    nextTier: 'SILVER',
    milestones: [3, 7, 14, 30],
  };
  // 哈什特·什里瓦斯塔夫
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
        streakCalendar: customer.streakCalendar,
        rewardsAvailable: Math.floor(customer.points / 100),
        progressPercent: progress,
        pointsToNextTier: next ? Math.max(0, next.pointsNeeded - customer.points) : 0,
        nextTier: next?.tier ?? tier,
        milestones: cafeSettings.streakMilestones,
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
      tableNumber={tableNumber}
      gstRate={cafeSettings.gstRate}
    />
  );
}
