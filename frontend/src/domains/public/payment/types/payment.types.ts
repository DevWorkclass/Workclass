/**
 * Types du domaine `payment` (public).
 * v1 : Placeholder. v2 : Stripe / Paystack / Orange Money via webhooks.
 */

export type PaymentProvider = 'simulation' | 'stripe' | 'paystack' | 'orange_money';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface PaymentInitiateInput {
  bookingId: string;
  provider: PaymentProvider;
}

export interface PaymentInitiateResult {
  redirectUrl?: string;
  providerReference?: string;
  status: PaymentStatus;
}

export interface PaymentWebhookPayload {
  provider: PaymentProvider;
  providerReference: string;
  bookingReference: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  signature: string;
}
