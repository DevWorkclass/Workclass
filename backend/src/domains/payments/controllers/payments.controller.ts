/**
 * Contrôleur payments.
 */

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PaymentsService } from '../services/payments.service';

const initiateSchema = z.object({
  bookingId: z.string().uuid('ID reservation invalide'),
  provider: z.enum(['stripe', 'paystack', 'orange_money', 'simulation']),
});

const simulateSchema = z.object({
  paymentId: z.string().uuid('ID paiement invalide'),
});

export class PaymentsController {
  private readonly service = new PaymentsService();

  async initiate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = initiateSchema.parse(req.body);
      const result = await this.service.initiate(data);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async simulate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { paymentId } = simulateSchema.parse(req.body);
      const payment = await this.service.simulatePayment(paymentId);
      res.json({ success: true, data: payment });
    } catch (error) {
      next(error);
    }
  }
}
