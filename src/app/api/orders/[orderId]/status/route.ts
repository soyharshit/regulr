import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as orderRepo from '@/lib/repositories/order';

interface Params {
  orderId: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Params }
) {
  const { orderId } = params;

  try {
    const order = await orderRepo.getByIdPublic(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({
      id: order.id,
      status: order.status,
      updatedAt: order.updatedAt,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Params }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || !role || !['OWNER', 'STAFF', 'SUPERADMIN'].includes(role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orderId } = params;
  const body = await request.json();
  const { status, cafeId } = body;

  const validStatuses = ['PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  if (!cafeId) {
    return NextResponse.json({ error: 'cafeId required' }, { status: 400 });
  }

  try {
    const order = await orderRepo.updateStatus(cafeId, orderId, status);
    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: 'Order not found or unauthorized' }, { status: 404 });
  }
}
