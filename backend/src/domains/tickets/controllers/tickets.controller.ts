/**
 * Contrôleur tickets.
 */

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TicketGeneratorService } from '../services/ticket-generator.service';

const generateSchema = z.object({
  bookingId: z.string().uuid('ID reservation invalide'),
});

export class TicketsController {
  private readonly service = new TicketGeneratorService();

  async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bookingId } = generateSchema.parse(req.body);
      const result = await this.service.generateTicket(bookingId);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
