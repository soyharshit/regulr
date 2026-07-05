import { NextResponse } from 'next/server';
import { getByIdPublic, updateStatus } from '@/lib/repositories/order';

export async function GET(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  try {
    const order = await getByIdPublic(orderId);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json({ status: order.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  try {
    // In a real app, verify the owner/staff session here before allowing status updates.
    // We assume the frontend passes the correct cafeId for verification
    const body = await request.json();
    const { status, cafeId } = body;
    
    if (!cafeId) return NextResponse.json({ error: 'cafeId is required' }, { status: 400 });

    const updated = await updateStatus(cafeId, orderId, status);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
