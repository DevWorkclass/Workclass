/**
 * Service paiements.
 *  v1 : provider `simulation` uniquement (placeholder).
 *  v2 : Stripe / Paystack / Orange Money via webhooks (architecture prête).
 *
 * Adaptation schéma : Payment.providerReference (pas .transactionId).
 */

import { prisma } from '../../../config/database';
import {
  NotFoundError,
  ValidationError,
} from '../../shared/errors/types/error.types';
import { logAudit } from '../../shared/audit/services/audit.service';
import type {
  PaymentInitiateInput,
  PaymentInitiateResult,
} from '../types/payments.types';

export class PaymentsService {
  async initiate(data: PaymentInitiateInput): Promise<PaymentInitiateResult> {
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
    });
    if (!booking) throw new NotFoundError('Reservation');
    if (booking.paymentStatus === 'paid') {
      throw new ValidationError('Reservation deja payee');
    }

    if (data.provider !== 'simulation') {
      throw new ValidationError('Paiement reel non disponible en v1');
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId: data.bookingId,
        amount: booking.totalAmount,
        currency: booking.currency,
        status: 'pending',
        provider: 'simulation',
      },
    });

    await logAudit({
      action: 'PAYMENT_INITIATED',
      resource: 'payment',
      resourceId: payment.id,
      details: { provider: 'simulation', amount: Number(booking.totalAmount) },
      result: 'success',
    });

    return {
      payment: {
        id: payment.id,
        bookingId: payment.bookingId,
        amount: Number(payment.amount),
        status: payment.status,
        provider: payment.provider,
      },
      redirectUrl: `/paiement/simulation?paymentId=${payment.id}`,
    };
  }

  /**
   * Simulation manuelle d'un paiement réussi (dev / placeholder v1).
   * v2 : remplacé par la réception d'un webhook signé.
   */
  async simulatePayment(paymentId: string): Promise<{
    id: string;
    bookingId: string;
    status: string;
    providerReference: string | null;
  }> {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new NotFoundError('Paiement');

    const providerReference = `SIM-${Date.now()}`;

    const [updated] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'paid', providerReference },
      }),
      prisma.booking.update({
        where: { id: payment.bookingId },
        data: { paymentStatus: 'paid' },
      }),
    ]);

    await logAudit({
      action: 'PAYMENT_SIMULATED',
      resource: 'payment',
      resourceId: paymentId,
      details: { providerReference },
      result: 'success',
    });

    return {
      id: updated.id,
      bookingId: updated.bookingId,
      status: updated.status,
      providerReference: updated.providerReference,
    };
  }
}
