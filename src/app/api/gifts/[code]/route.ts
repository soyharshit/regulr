import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  try {
    const gift = await db.gift.findUnique({
      where: { claimCode: code },
      include: { cafe: { select: { name: true, slug: true } } },
    });
    if (!gift) {
      return NextResponse.json({ error: 'Gift not found' }, { status: 404 });
    }
    return NextResponse.json({
      id: gift.id,
      menuItemName: gift.menuItemName,
      quantity: gift.quantity,
      recipientName: gift.recipientName,
      message: gift.message,
      claimCode: gift.claimCode,
      claimedAt: gift.claimedAt,
      cafe: gift.cafe,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  try {
    const gift = await db.gift.findUnique({ where: { claimCode: code } });
    if (!gift) {
      return NextResponse.json({ error: 'Gift not found' }, { status: 404 });
    }
    if (gift.claimedAt) {
      return NextResponse.json({ error: 'Gift already claimed' }, { status: 409 });
    }

    await db.gift.update({
      where: { id: gift.id },
      data: { claimedAt: new Date() },
    });

    return NextResponse.json({ success: true, menuItemName: gift.menuItemName });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
