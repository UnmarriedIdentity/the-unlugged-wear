import crypto from 'crypto';

export interface CreateOrderParams {
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  receipt: string;
  status: 'created' | 'attempted' | 'paid';
  isSandboxDemo?: boolean;
}

export interface VerifySignatureParams {
  orderId: string;
  paymentId: string;
  signature: string;
}

/**
 * Returns whether real Razorpay credentials are configured in the environment.
 */
export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/**
 * Create an order on Razorpay or return an explicit sandbox order when credentials are not yet set.
 */
export async function createRazorpayOrder(params: CreateOrderParams): Promise<RazorpayOrderResult> {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    // Return explicit sandbox order — do NOT pretend live transaction occurred
    return {
      id: `order_sandbox_${Date.now()}`,
      entity: 'order',
      amount: params.amountPaise,
      currency: params.currency || 'INR',
      receipt: params.receipt,
      status: 'created',
      isSandboxDemo: true,
    };
  }

  const basicAuth = Buffer.from(`${keyId}:${keySecret}`).toString('base64');

  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${basicAuth}`,
    },
    body: JSON.stringify({
      amount: params.amountPaise,
      currency: params.currency || 'INR',
      receipt: params.receipt,
      notes: params.notes || {},
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Razorpay order creation failed (${res.status}): ${errorBody}`);
  }

  const data = await res.json();
  return {
    id: data.id,
    entity: data.entity,
    amount: data.amount,
    currency: data.currency,
    receipt: data.receipt,
    status: data.status,
    isSandboxDemo: false,
  };
}

/**
 * Verifies Razorpay payment signature sent to client on checkout completion.
 */
export function verifyRazorpayPaymentSignature({
  orderId,
  paymentId,
  signature,
}: VerifySignatureParams): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    // If no secret configured, fail verification rather than silently approving
    return false;
  }

  const payload = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(signature, 'utf-8')
    );
  } catch {
    return false;
  }
}

/**
 * Verifies Razorpay Webhook signature (`x-razorpay-signature`).
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret || !signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf-8'),
      Buffer.from(signature, 'utf-8')
    );
  } catch {
    return false;
  }
}
