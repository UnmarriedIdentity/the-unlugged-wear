import { NextRequest, NextResponse } from 'next/server';
import { verifyRazorpayWebhookSignature } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing x-razorpay-signature header' },
        { status: 400 }
      );
    }

    // Verify cryptographic signature
    const isValid = verifyRazorpayWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;

    // Process payment events idempotently
    switch (eventType) {
      case 'payment.captured':
      case 'order.paid': {
        const paymentEntity = event.payload?.payment?.entity;
        const orderId = paymentEntity?.order_id;
        // In live DB: transition order paymentStatus -> 'paid', record transaction ID
        console.log(`[Webhook Razorpay] Payment captured for order: ${orderId}`);
        break;
      }
      case 'payment.failed': {
        const paymentEntity = event.payload?.payment?.entity;
        const orderId = paymentEntity?.order_id;
        console.log(`[Webhook Razorpay] Payment failed for order: ${orderId}`);
        break;
      }
      default:
        console.log(`[Webhook Razorpay] Received unhandled event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
