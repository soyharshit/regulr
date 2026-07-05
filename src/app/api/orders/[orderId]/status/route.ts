import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getByIdPublic, updateStatus } from '@/lib/repositories/order';
import * as customerRepo from '@/lib/repositories/customer';
import * as cafeSettingsRepo from '@/lib/repositories/cafeSettings';
import { recordVisitForStreak, tierForPoints, REFERRAL_REFERRER_BONUS, REFERRAL_REFERRED_BONUS } from '@/lib/loyalty';
import * as referralRepo from '@/lib/repositories/referral';

const VALID_STATUSES = ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];

export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  try {
    const order = await getByIdPublic(orderId);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json({ status: order.status, pointsEarned: order.pointsEarned });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!session || !role || !['OWNER', 'STAFF', 'SUPERADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, cafeId } = body;

    if (!cafeId) return NextResponse.json({ error: 'cafeId is required' }, { status: 400 });
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const existing = await getByIdPublic(orderId);
    if (!existing || existing.cafeId !== cafeId) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const wasCompleted = existing.status === 'COMPLETED';
    await updateStatus(cafeId, orderId, status);

    // Award loyalty points / streak / referral bonus exactly once, on the
    // PENDING/PREPARING/READY -> COMPLETED transition.
    if (status === 'COMPLETED' && !wasCompleted && existing.customerId) {
      const settings = await cafeSettingsRepo.getByCafeId(cafeId);
      const pointsEarned = settings.loyaltyEnabled
        ? Math.floor((existing.totalAmount / 100) * settings.pointsPerRupee)
        : 0;

      const customer = await customerRepo.getById(cafeId, existing.customerId);
      if (customer) {
        const todayIso = new Date().toISOString().slice(0, 10);
        const { streakCalendar, streakCount } = recordVisitForStreak(
          customer.streakCalendar,
          customer.streakCount,
          todayIso
        );

        await db.customer.update({
          where: { id: customer.id },
          data: {
            points: customer.points + pointsEarned,
            tier: tierForPoints(customer.points + pointsEarned),
            streakCalendar,
            streakCount,
          },
        });

        // First completed order for a referred customer completes the referral
        // and pays out both sides.
        const priorCompletedCount = await db.order.count({
          where: { cafeId, customerId: customer.id, status: 'COMPLETED' },
        });
        if (priorCompletedCount === 1) {
          const referral = await db.referral.findUnique({ where: { referredId: customer.id } });
          if (referral && referral.status === 'PENDING' && referral.cafeId === cafeId) {
            await referralRepo.complete(cafeId, referral.id, REFERRAL_REFERRER_BONUS);
            await customerRepo.updatePoints(
              cafeId,
              customer.id,
              customer.points + pointsEarned + REFERRAL_REFERRED_BONUS
            );
          }
        }
      }

      await db.order.update({ where: { id: orderId }, data: { pointsEarned } });
    }

    const final = await getByIdPublic(orderId);
    return NextResponse.json(final);
  } catch (error) {
    console.error('Order status update failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
