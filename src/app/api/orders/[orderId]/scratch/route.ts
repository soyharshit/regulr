import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getByIdPublic } from '@/lib/repositories/order';
import { tierForPoints } from '@/lib/loyalty';
import { canAccessOrder } from '@/lib/apiAuth';

// Weighted surprise bonus — mostly small, occasional jackpot for the dopamine hit.
const BONUS_TABLE = [10, 10, 15, 15, 20, 20, 25, 30, 40, 75];

function pickBonus(): number {
  return BONUS_TABLE[Math.floor(Math.random() * BONUS_TABLE.length)];
}

// Reveal the scratch card on a completed order — grants a one-time bonus that
// gives customers a reason to come back and complete another order.
export async function POST(_request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  const order = await getByIdPublic(orderId);
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (!(await canAccessOrder(order))) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (order.status !== 'COMPLETED' || !order.customerId) {
    return NextResponse.json({ error: 'Scratch card not available yet' }, { status: 400 });
  }

  // Already scratched → return the same bonus (idempotent).
  const current = await db.order.findUnique({ where: { id: orderId } });
  if (current?.scratchedAt) {
    return NextResponse.json({ bonus: current.bonusPoints, alreadyScratched: true });
  }

  const bonus = pickBonus();

  // Atomically claim the scratch so concurrent taps can't double-award.
  const claim = await db.order.updateMany({
    where: { id: orderId, scratchedAt: null },
    data: { scratchedAt: new Date(), bonusPoints: bonus },
  });

  if (claim.count !== 1) {
    const after = await db.order.findUnique({ where: { id: orderId } });
    return NextResponse.json({ bonus: after?.bonusPoints ?? 0, alreadyScratched: true });
  }

  const customer = await db.customer.findUnique({ where: { id: order.customerId } });
  if (customer) {
    const updated = await db.customer.update({
      where: { id: customer.id },
      data: { points: { increment: bonus } },
    });
    await db.customer.update({
      where: { id: customer.id },
      data: { tier: tierForPoints(updated.points) },
    });
  }

  return NextResponse.json({ bonus, alreadyScratched: false });
}
