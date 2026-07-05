import { NextResponse } from 'next/server';
import { create } from '@/lib/repositories/order';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cafeId, items, paymentMethod } = body;

    if (!cafeId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'cafeId and items are required' }, { status: 400 });
    }

    // Fetch all menu items from database to get the official prices
    const menuItemIds = items.map((item: any) => item.menuItemId);
    const menuDbItems = await db.menuItem.findMany({
      where: { id: { in: menuItemIds }, cafeId },
    });

    let totalAmount = 0;
    const orderItemsCreate = [];

    for (const item of items) {
      const dbItem = menuDbItems.find((m) => m.id === item.menuItemId);
      if (!dbItem) {
        return NextResponse.json({ error: `Menu item ${item.menuItemId} not found` }, { status: 400 });
      }
      const quantity = Number(item.quantity) || 1;
      const price = dbItem.price; // Paise
      totalAmount += price * quantity;

      orderItemsCreate.push({
        menuItem: { connect: { id: item.menuItemId } },
        quantity,
        price,
      });
    }

    // Build the order payload for the repository
    const payload = {
      totalAmount,
      status: 'PENDING',
      paymentMethod: paymentMethod || 'CASH',
      orderItems: {
        create: orderItemsCreate
      }
    };

    const order = await create(cafeId, payload);
    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Order creation failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
