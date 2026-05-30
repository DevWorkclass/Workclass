import type { Request, Response, NextFunction } from 'express';
import {
  ticketGenerateSchema,
  ticketGetSchema,
} from '../validators/tickets.validator.js';
import { ticketGeneratorService } from '../services/ticket-generator.service.js';

export const ticketsController = {
  async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = ticketGenerateSchema.parse(req.body);
      const ticket = await ticketGeneratorService.generate(input);
      res.status(201).json({ success: true, data: ticket });
    } catch (err) {
      next(err);
    }
  },

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = ticketGetSchema.parse(req.body);
      const ticket = await ticketGeneratorService.get(input.ticketId);
      if (!ticket) {
        res.status(404).json({
          success: false,
          error: { code: 'not_found', message: 'Billet introuvable' },
        });
        return;
      }
      res.json({ success: true, data: ticket });
    } catch (err) {
      next(err);
    }
  },
};
