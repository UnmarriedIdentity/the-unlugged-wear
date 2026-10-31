import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_ORDERS } from '@/mocks/fixtures';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = INITIAL_ORDERS.find(
      (o) => o.id === id || o.orderNumber.toLowerCase() === id.toLowerCase()
    );

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or access unauthorized.' },
        { status: 404 }
      );
    }

    // Mask sensitive phone number / personal details for public inquiries
    const sanitizedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      date: order.date,
      status: order.status,
      paymentStatus: order.paymentStatus || 'paid',
      fulfillmentStatus: order.fulfillmentStatus || 'queued',
      carrier: order.carrier,
      estimatedDelivery: order.estimatedDelivery,
      partnerOrderId: order.partnerOrderId,
      items: order.items.map((it) => ({
        id: it.id,
        title: it.title,
        color: it.color,
        size: it.size,
        quantity: it.quantity,
        priceINR: it.priceINR,
        image: it.image,
      })),
      subtotalINR: order.subtotalINR,
      shippingINR: order.shippingINR,
      discountINR: order.discountINR,
      totalINR: order.totalINR,
      trackingEvents: order.trackingEvents || [],
    };

    return NextResponse.json({ success: true, order: sanitizedOrder });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
