/**
 * Service paiements. v1 = simulation placeholder. v2 = webhooks réels.
 */
import type {
  PaymentInitiateInput,
  PaymentInitiateResult,
  PaymentWebhookPayload,
} from '../types/payments.types.js';

export const paymentsService = {
  async initiate(_input: PaymentInitiateInput): Promise<PaymentInitiateResult> {
    // v1 : retourne immédiatement status 'pending' avec providerReference simulé.
    throw new Error('Not implemented — ÉTAPE 6 backend');
  },
  async handleWebhook(_payload: PaymentWebhookPayload): Promise<void> {
    // v2 : vérifier signature provider + update booking.payment_status.
    throw new Error('Not implemented — v2');
  },
};
