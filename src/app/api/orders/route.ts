import { NextRequest, NextResponse } from 'next/server';
import * as orderRepo from '@/lib/repositories/order';
import * as menuItemRepo from '@/lib/repositories/menuItem';
import { calculateOrderTotal } from '@/lib/pricing/pricingEngine';
import { db } from '@/lib/db';

const ALLOWED_PAYMENT_METHODS = new Set(['CASH', 'UPI', 'RAZORPAY']);

export async function GET(request: NextRequest) {
  const cafeId = request.nextUrl.searchParams.get('cafeId');
  const slug = request.nextUrl.searchParams.get('slug');

  let resolvedCafeId = cafeId;

  if (!resolvedCafeId && slug) {
    const cafe = await db.cafe.findUnique({ where: { slug } });
    if (!cafe) {
      return NextResponse.json({ error: 'Cafe not found' }, { status: 404 });
    }
    resolvedCafeId = cafe.id;
  }

  if (!resolvedCafeId) {
    return NextResponse.json({ error: 'cafeId or slug required' }, { status: 400 });
  }

  try {
    const orders = await orderRepo.list(resolvedCafeId);
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Order list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cafeId, items, paymentMethod = 'CASH', customerId } = body;
    // items: Array<{ menuItemId: string; quantity: number }>

    if (!cafeId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing cafeId or items' }, { status: 400 });
    }

    if (!ALLOWED_PAYMENT_METHODS.has(paymentMethod)) {
      return NextResponse.json({ error: 'Unsupported payment method' }, { status: 400 });
    }

    // Calculate subtotal in paise
    let subtotalPaise = 0;
    const validatedItems: { menuItemId: string; quantity: number; price: number }[] = [];

    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 20) {
        return NextResponse.json({ error: 'Invalid item quantity' }, { status: 400 });
      }

      const menuItem = await menuItemRepo.getById(cafeId, item.menuItemId);
      if (!menuItem || !menuItem.isAvailable) {
        return NextResponse.json({ error: `MenuItem ${item.menuItemId} not found` }, { status: 400 });
      }
      subtotalPaise += menuItem.price * quantity;
      validatedItems.push({ menuItemId: item.menuItemId, quantity, price: menuItem.price });
    }

    if (customerId) {
      const customer = await db.customer.findFirst({ where: { id: customerId, cafeId } });
      if (!customer) {
        return NextResponse.json({ error: 'Customer not found for cafe' }, { status: 400 });
      }
    }

    const pricing = calculateOrderTotal({ subtotal: subtotalPaise, gstRate: 0.05 });

    const order = await orderRepo.create(cafeId, {
      totalAmount: pricing.grandTotal,
      paymentMethod,
      status: 'PENDING',
      ...(customerId ? { customer: { connect: { id: customerId } } } : {}),
      orderItems: {
        create: validatedItems.map(item => ({
          menuItem: { connect: { id: item.menuItemId } },
          quantity: item.quantity,
          price: item.price,
        })),
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
