/**
 * Types du domaine payments.
 */

export type PaymentProvider = 'simulation' | 'stripe' | 'paystack' | 'orange_money';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface PaymentInitiateInput {
  bookingId: string;
  provider: PaymentProvider;
}

export interface PaymentInitiateResult {
  payment: {
    id: string;
    bookingId: string;
    amount: number;
    status: PaymentStatus;
    provider: string;
  };
  redirectUrl?: string;
}
