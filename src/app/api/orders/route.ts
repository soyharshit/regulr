import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import * as orderRepo from '@/lib/repositories/order';
import * as customerRepo from '@/lib/repositories/customer';
import * as cafeSettingsRepo from '@/lib/repositories/cafeSettings';
import { calculateOrderTotal, POINTS_TO_PAISE_RATE } from '@/lib/pricing/pricingEngine';
import { requireCafe } from '@/lib/apiAuth';

const GST_RATE = 0.05;

// Owner/staff order feed — scoped to the caller's own cafe (session-derived).
export async function GET() {
  const auth = await requireCafe();
  if ('error' in auth) return auth.error;
  try {
    const orders = await orderRepo.list(auth.cafe.id);
    return NextResponse.json(orders);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cafeId, items, paymentMethod, couponCode, pointsToRedeem, tableNumber } = body;

    if (!cafeId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'cafeId and items are required' }, { status: 400 });
    }

    // The cafe must exist and be active before we accept an order.
    const cafe = await db.cafe.findUnique({ where: { id: cafeId } });
    if (!cafe) return NextResponse.json({ error: 'Cafe not found' }, { status: 404 });
    if (!cafe.isActive) {
      return NextResponse.json({ error: 'This store is not accepting orders right now' }, { status: 403 });
    }

    // Fetch all menu items from the DB to get the official (server-trusted) prices.
    const menuItemIds = items.map((item: { menuItemId: string }) => item.menuItemId);
    const menuDbItems = await db.menuItem.findMany({
      where: { id: { in: menuItemIds }, cafeId },
    });

    let subtotal = 0;
    const orderItemsCreate = [];

    for (const item of items) {
      const dbItem = menuDbItems.find((m) => m.id === item.menuItemId);
      if (!dbItem) {
        return NextResponse.json({ error: `Menu item ${item.menuItemId} not found` }, { status: 400 });
      }
      if (!dbItem.isAvailable) {
        return NextResponse.json({ error: `${dbItem.name} is sold out` }, { status: 400 });
      }
      const quantity = Math.max(1, Math.round(Number(item.quantity)) || 1);
      const price = dbItem.price; // Paise
      subtotal += price * quantity;

      orderItemsCreate.push({
        menuItem: { connect: { id: item.menuItemId } },
        quantity,
        price,
      });
    }

    // A signed-in customer ordering for themselves gets linked automatically so
    // points/streaks accrue. Staff placing a walk-in bill never carries a
    // CUSTOMER session, so this never fires for POS orders.
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { id?: string; role?: string } | undefined;
    let customer = null;
    if (sessionUser?.role === 'CUSTOMER' && sessionUser.id) {
      customer = await customerRepo.findOrCreateForUser(cafeId, sessionUser.id);
    }

    // Coupon lookup + validation
    let resolvedCoupon = null;
    if (couponCode) {
      const coupon = await cafeSettingsRepo.findCoupon(cafeId, couponCode);
      if (!coupon) {
        return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
      }
      if (coupon.maxUses) {
        const usedCount = await db.order.count({
          where: { cafeId, couponCode: coupon.code, status: { not: 'CANCELLED' } },
        });
        if (usedCount >= coupon.maxUses) {
          return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
        }
      }
      resolvedCoupon = coupon;
    }

    // Points redemption — only a signed-in customer can redeem their own points.
    let pointsRequested = 0;
    if (pointsToRedeem && customer) {
      pointsRequested = Math.max(0, Math.min(Math.round(Number(pointsToRedeem)) || 0, customer.points));
    }

    const pricing = calculateOrderTotal({
      subtotal,
      resolvedCoupon,
      loyaltyTierPointsApplied: pointsRequested,
      gstRate: GST_RATE,
    });

    // Only burn the points that actually produced a discount (the engine caps
    // the tier discount at the order value) — never silently eat extra points.
    const pointsUsed = Math.floor(pricing.tierDiscount / POINTS_TO_PAISE_RATE);

    const parsedTable = Number(tableNumber);
    const payload = {
      subtotalAmount: subtotal,
      discountAmount: pricing.couponDiscount + pricing.tierDiscount,
      couponCode: resolvedCoupon ? resolvedCoupon.code : null,
      pointsRedeemed: pointsUsed,
      tableNumber: Number.isInteger(parsedTable) && parsedTable > 0 ? parsedTable : null,
      totalAmount: pricing.grandTotal,
      status: 'PENDING',
      paymentMethod: paymentMethod || 'CASH',
      ...(customer ? { customer: { connect: { id: customer.id } } } : {}),
      orderItems: {
        create: orderItemsCreate,
      },
    };

    const order = await orderRepo.create(cafeId, payload);

    if (customer && pointsUsed > 0) {
      await db.customer.update({
        where: { id: customer.id },
        data: { points: { decrement: pointsUsed } },
      });
    }

    return NextResponse.json({ ...order, pricing });
  } catch (error) {
    console.error('Order creation failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
