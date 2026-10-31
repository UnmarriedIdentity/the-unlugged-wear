import { NextRequest, NextResponse } from 'next/server';
import { submitOrderToQikink } from '@/lib/qikink';
import { INITIAL_ORDERS } from '@/mocks/fixtures';

export async function POST(req: NextRequest) {
  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const order = INITIAL_ORDERS.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const result = await submitOrderToQikink(order);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
