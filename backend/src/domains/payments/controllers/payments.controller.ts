import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { paymentsService } from '../services/payments.service.js';

const initiateSchema = z.object({
  bookingId: z.string().uuid(),
  provider: z.enum(['simulation', 'stripe', 'paystack', 'orange_money']),
});

export const paymentsController = {
  async initiate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = initiateSchema.parse(req.body);
      const result = await paymentsService.initiate(input);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },
};
