import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { randomBytes } from 'crypto';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import * as cafeSettingsRepo from '@/lib/repositories/cafeSettings';
import * as customerRepo from '@/lib/repositories/customer';
import { tierForPoints } from '@/lib/loyalty';

function voucherCode(): string {
  return 'RW-' + randomBytes(4).toString('hex').toUpperCase();
}

// GET: the cafe's reward catalog + the signed-in customer's active vouchers + balance.
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

  const cafe = await db.cafe.findUnique({ where: { slug } });
  if (!cafe) return NextResponse.json({ error: 'Cafe not found' }, { status: 404 });

  const settings = await cafeSettingsRepo.getByCafeId(cafe.id);

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  let points = 0;
  let redemptions: { id: string; rewardTitle: string; code: string; status: string; createdAt: Date }[] = [];
  if (userId) {
    const customer = await customerRepo.getByUserId(cafe.id, userId);
    if (customer) {
      points = customer.points;
      redemptions = await db.rewardRedemption.findMany({
        where: { cafeId: cafe.id, customerId: customer.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    }
  }

  return NextResponse.json({ rewards: settings.rewards, points, redemptions });
}

// POST: redeem a reward for a voucher.
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: 'Sign in to redeem rewards' }, { status: 401 });

  const body = await request.json();
  const { slug, rewardId } = body;
  if (!slug || !rewardId) return NextResponse.json({ error: 'slug and rewardId required' }, { status: 400 });

  const cafe = await db.cafe.findUnique({ where: { slug } });
  if (!cafe) return NextResponse.json({ error: 'Cafe not found' }, { status: 404 });

  const settings = await cafeSettingsRepo.getByCafeId(cafe.id);
  const reward = settings.rewards.find((r) => r.id === rewardId);
  if (!reward) return NextResponse.json({ error: 'Reward not found' }, { status: 404 });

  const customer = await customerRepo.getByUserId(cafe.id, userId);
  if (!customer) return NextResponse.json({ error: 'No loyalty profile at this cafe' }, { status: 400 });
  if (customer.points < reward.cost) {
    return NextResponse.json({ error: 'Not enough points' }, { status: 400 });
  }

  // Deduct points and issue a voucher.
  const updated = await db.customer.update({
    where: { id: customer.id },
    data: { points: { decrement: reward.cost } },
  });
  await db.customer.update({
    where: { id: customer.id },
    data: { tier: tierForPoints(updated.points) },
  });

  const redemption = await db.rewardRedemption.create({
    data: {
      cafeId: cafe.id,
      customerId: customer.id,
      rewardTitle: reward.title,
      cost: reward.cost,
      code: voucherCode(),
    },
  });

  return NextResponse.json({
    ok: true,
    code: redemption.code,
    rewardTitle: reward.title,
    pointsRemaining: updated.points,
  });
}
