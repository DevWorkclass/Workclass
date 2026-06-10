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

  /** GET /public/certificate/:number — vérification publique (QR). */
  async verifyCertificate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const number = String(req.params.number ?? '').slice(0, 60);
      const result = await this.service.verifyCertificate(number);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(String(req.query.page ?? '1'), 10) || 1;
      const limit = parseInt(String(req.query.limit ?? '20'), 10) || 20;
      const result = await this.service.listTickets({ page, limit });
      res.json({
        success: true,
        data: result.tickets,
        meta: { total: result.total, page, limit },
      });
    } catch (error) {
      next(error);
    }
  }
}
