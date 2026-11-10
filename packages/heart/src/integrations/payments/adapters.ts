// Payment gateway interface + adapters (integrations skill). Only the demo
// gateway exists until the integrations phase (TL-INT-RAZORPAY). Statuses
// use the payments.status vocabulary (004-orders.sql).

export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded';

export interface PaymentIntentInput {
  /** Our payment reference (unique per attempt) — makes the call idempotent at the provider. */
  reference: string;
  amountPaise: number;
  currency: 'INR';
  /** Demo only: force a decline to exercise the failure path. */
  simulate?: 'decline';
}

export interface PaymentResult {
  providerRef: string;
  status: PaymentStatus;
  /** Raw provider word, kept for audit. */
  providerStatus: string;
}

export interface PaymentGateway {
  slug: string;
  /** True only for a real adapter whose live keys are present in env. */
  liveReady(): boolean;
  createPayment(input: PaymentIntentInput): Promise<PaymentResult>;
  refund(input: { providerRef: string; amountPaise: number; reference: string }): Promise<PaymentResult>;
}

/** Demo gateway: deterministic, collects nothing ("Demo payment — no money will be collected"). */
export const mockGateway: PaymentGateway = {
  slug: 'mock',
  liveReady: () => false,
  async createPayment(input) {
    if (!Number.isSafeInteger(input.amountPaise) || input.amountPaise <= 0) throw new RangeError('amountPaise must be a positive integer');
    const declined = input.simulate === 'decline';
    return { providerRef: `mock_pay_${input.reference}`, status: declined ? 'failed' : 'captured', providerStatus: declined ? 'declined' : 'captured' };
  },
  async refund(input) {
    if (!Number.isSafeInteger(input.amountPaise) || input.amountPaise <= 0) throw new RangeError('amountPaise must be a positive integer');
    return { providerRef: `mock_refund_${input.reference}`, status: 'refunded', providerStatus: 'processed' };
  },
};

export const paymentAdapters: readonly PaymentGateway[] = [mockGateway];
