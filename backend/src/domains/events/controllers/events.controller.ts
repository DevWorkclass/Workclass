import type { Request, Response, NextFunction } from 'express';
import { EventsService } from '../services/events.service';
import {
  createEventSchema,
  updateEventSchema,
  deleteEventSchema,
} from '../validators/events.validator';
import { ValidationError } from '../../shared/errors/types/error.types';

export class EventsController {
  private readonly service = new EventsService();

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = createEventSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Donnees invalides: ' + parsed.error.message);
      }

      // L'utilisateur est forcément défini car protégé par authMiddleware
      const event = await this.service.createEvent(parsed.data, req.user!.userId);

      res.status(201).json({
        success: true,
        data: event,
      });
    } catch (err) {
      next(err);
    }
  }

  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const events = await this.service.getEvents();
      res.json({
        success: true,
        data: events,
      });
    } catch (err) {
      next(err);
    }
  }

  /** Liste publique (événements publiés) — non sensible, GET autorisé. */
  async publicList(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const events = await this.service.getPublicEvents();
      res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      res.json({ success: true, data: events });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = updateEventSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Donnees invalides: ' + parsed.error.message);
      }
      const event = await this.service.updateEvent(parsed.data, req.user!.userId);
      res.json({ success: true, data: event });
    } catch (err) {
      next(err);
    }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = deleteEventSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ValidationError('Donnees invalides: ' + parsed.error.message);
      }
      const result = await this.service.deleteEvent(parsed.data.id, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
}
