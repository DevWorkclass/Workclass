/**
 * Contrôleur booking — orchestration HTTP.
 * Toutes les routes manipulant une référence ou un id sont en POST avec body JSON.
 */

import type { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/booking.service';
import {
  createBookingSchema,
  bookingReferenceSchema,
} from '../validators/booking.validator';
import { z } from 'zod';
import { ValidationError } from '../../shared/errors/types/error.types';

const adminBookingIdSchema = z.object({ id: z.string().uuid('ID reservation invalide') });
const cancelSchema = adminBookingIdSchema.extend({ reason: z.string().max(500).optional() });

export class BookingController {
  private readonly service = new BookingService();

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createBookingSchema.parse(req.body);
      const booking = await this.service.create(data);
      res.status(201).json({ success: true, data: booking });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /bookings/lookup — consultation par référence (donnée sensible → POST + body).
   */
  async lookup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { reference } = bookingReferenceSchema.parse(req.body);
      const booking = await this.service.getByReference(reference);
      res.json({ success: true, data: booking });
    } catch (error) {
      next(error);
    }
  }

  async validate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = adminBookingIdSchema.parse(req.body);
      const adminId = req.user?.userId;
      if (!adminId) throw new ValidationError('Admin requis');
      const booking = await this.service.validateBooking(id, adminId);
      res.json({ success: true, data: booking });
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = cancelSchema.parse(req.body);
      const adminId = req.user?.userId;
      if (!adminId) throw new ValidationError('Admin requis');
      const booking = await this.service.cancelBooking(id, adminId);
      res.json({ success: true, data: booking });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(String(req.query.page ?? '1'), 10) || 1;
      const limit = parseInt(String(req.query.limit ?? '20'), 10) || 20;
      const statusParam = req.query.status as string | undefined;
      const status =
        statusParam === 'pending' || statusParam === 'confirmed' || statusParam === 'cancelled'
          ? statusParam
          : undefined;
      const eventIdParam = req.query.eventId as string | undefined;
      const eventId = eventIdParam && /^[0-9a-f-]{36}$/i.test(eventIdParam) ? eventIdParam : undefined;
      const result = await this.service.listBookings({ page, limit, status, eventId });
      res.json({
        success: true,
        data: result.bookings,
        meta: { total: result.total, page, limit },
      });
    } catch (error) {
      next(error);
    }
  }
}
