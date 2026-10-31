/**
 * Server-only Qikink Print-On-Demand API integration boundary.
 * Secrets: QIKINK_CLIENT_ID, QIKINK_API_KEY, QIKINK_ENDPOINT (server-only).
 */

import { Order, FulfillmentStatus } from './types';

export interface QikinkLineItem {
  sku: string;
  quantity: number;
  price: number;
  print_placement?: string;
  design_url?: string;
}

export interface QikinkOrderPayload {
  order_number: string;
  first_name: string;
  last_name: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  zip: string;
  country: string;
  phone: string;
  gateway: 'prepaid' | 'cod';
  line_items: QikinkLineItem[];
}

export interface QikinkSubmissionResult {
  success: boolean;
  qikinkOrderId?: string;
  status: FulfillmentStatus;
  errorMessage?: string;
  isSandboxDemo?: boolean;
  submittedAt: string;
}

/**
 * Checks whether live Qikink credentials exist in environment.
 */
export function isQikinkConfigured(): boolean {
  return Boolean(
    process.env.QIKINK_CLIENT_ID &&
    process.env.QIKINK_API_KEY &&
    process.env.QIKINK_ENDPOINT
  );
}

/**
 * Submits an eligible paid/authorized order to the Qikink Print-on-Demand backend.
 * Uses idempotency and validation; never duplicates submissions.
 */
export async function submitOrderToQikink(order: Order): Promise<QikinkSubmissionResult> {
  // Guard: Never submit an unpaid order to production printing
  if (order.paymentStatus === 'failed' || order.paymentStatus === 'refunded') {
    return {
      success: false,
      status: 'submission_failed',
      errorMessage: `Order payment status '${order.paymentStatus}' is not eligible for fulfillment.`,
      submittedAt: new Date().toISOString(),
    };
  }

  // Guard: Guard against duplicate submissions if already assigned a provider ID
  if (order.partnerOrderId && order.fulfillmentStatus === 'printing') {
    return {
      success: true,
      qikinkOrderId: order.partnerOrderId,
      status: 'printing',
      submittedAt: new Date().toISOString(),
    };
  }

  const clientId = process.env.QIKINK_CLIENT_ID;
  const apiKey = process.env.QIKINK_API_KEY;
  const endpoint = process.env.QIKINK_ENDPOINT || 'https://api.qikink.com/api/v2';

  if (!clientId || !apiKey) {
    // Graceful sandbox fallback: do NOT fake live API success, clearly flag sandbox status
    return {
      success: true,
      qikinkOrderId: `QIK-DEMO-${Date.now().toString().slice(-6)}`,
      status: 'queued',
      isSandboxDemo: true,
      errorMessage: 'Live Qikink credentials (QIKINK_CLIENT_ID / QIKINK_API_KEY) not configured. Running in sandbox queue mode.',
      submittedAt: new Date().toISOString(),
    };
  }

  // Map order to Qikink payload format
  const nameParts = (order.shippingAddress.fullName || 'Customer').split(' ');
  const firstName = nameParts[0] || 'Customer';
  const lastName = nameParts.slice(1).join(' ') || '.';

  const payload: QikinkOrderPayload = {
    order_number: order.orderNumber,
    first_name: firstName,
    last_name: lastName,
    address1: order.shippingAddress.addressLine1,
    address2: order.shippingAddress.addressLine2,
    city: order.shippingAddress.city,
    province: order.shippingAddress.state,
    zip: order.shippingAddress.postalCode,
    country: 'India',
    phone: order.shippingAddress.phone,
    gateway: order.paymentMethod === 'COD (Demo)' ? 'cod' : 'prepaid',
    line_items: order.items.map((it) => ({
      sku: `TUW-${it.productId}-${it.color}-${it.size}`.toUpperCase().replace(/\s+/g, '-'),
      quantity: it.quantity,
      price: it.priceINR,
    })),
  };

  try {
    const response = await fetch(`${endpoint}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ClientId': clientId,
        'ApiKey': apiKey,
        'Idempotency-Key': order.orderNumber,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        status: 'submission_failed',
        errorMessage: `Qikink API error (${response.status}): ${errText}`,
        submittedAt: new Date().toISOString(),
      };
    }

    const data = await response.json();
    return {
      success: true,
      qikinkOrderId: data.order_id || data.id || `QIK-${order.orderNumber}`,
      status: 'printing',
      submittedAt: new Date().toISOString(),
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Network error';
    return {
      success: false,
      status: 'submission_failed',
      errorMessage: `Failed to connect to Qikink endpoint: ${errorMsg}`,
      submittedAt: new Date().toISOString(),
    };
  }
}
