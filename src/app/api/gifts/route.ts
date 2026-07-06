import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

function generateClaimCode(): string {
  return crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 8);
}

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get('orderId');
  if (!orderId) {
    return NextResponse.json({ error: 'orderId query param required' }, { status: 400 });
  }
  try {
    const gifts = await db.gift.findMany({
      where: { orderId },
      select: { claimCode: true, menuItemName: true, quantity: true, recipientName: true },
    });
    return NextResponse.json({ gifts });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, gifts } = body;

    if (!orderId || !gifts || !Array.isArray(gifts) || gifts.length === 0) {
      return NextResponse.json({ error: 'orderId and gifts array are required' }, { status: 400 });
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { cafe: true, customer: true },
    });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const created = [];
    for (const gift of gifts) {
      const { menuItemId, recipientName, message, quantity } = gift;
      if (!menuItemId || !recipientName) {
        return NextResponse.json({ error: 'menuItemId and recipientName are required for each gift' }, { status: 400 });
      }

      const menuItem = await db.menuItem.findUnique({ where: { id: menuItemId } });
      if (!menuItem) return NextResponse.json({ error: `Menu item ${menuItemId} not found` }, { status: 404 });

      const code = generateClaimCode();
      const record = await db.gift.create({
        data: {
          orderId,
          cafeId: order.cafeId,
          customerId: order.customerId,
          menuItemId,
          menuItemName: menuItem.name,
          quantity: quantity || 1,
          recipientName,
          message: message || null,
          claimCode: code,
        },
      });
      created.push(record);
    }

    return NextResponse.json({ gifts: created });
  } catch (error) {
    console.error('Gift creation failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
