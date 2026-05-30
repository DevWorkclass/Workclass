/**
 * Contrôleur booking — orchestration HTTP.
 * Pattern : valider (Zod) → déléguer au service → répondre.
 */

import type { Request, Response, NextFunction } from 'express';
import {
  bookingCreateSchema,
  bookingLookupSchema,
} from '../validators/booking.validator.js';
import { bookingService } from '../services/booking.service.js';

export const bookingController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = bookingCreateSchema.parse(req.body);
      const booking = await bookingService.create(input);
      res.status(201).json({ success: true, data: booking });
    } catch (err) {
      next(err);
    }
  },

  async lookup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = bookingLookupSchema.parse(req.body);
      const booking = await bookingService.lookup(input);
      if (!booking) {
        res.status(404).json({
          success: false,
          error: { code: 'not_found', message: 'Réservation introuvable' },
        });
        return;
      }
      res.json({ success: true, data: booking });
    } catch (err) {
      next(err);
    }
  },
};
