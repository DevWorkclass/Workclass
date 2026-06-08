/**
 * Contrôleur feedback.
 */

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { FeedbackService } from '../services/feedback.service';
import { ValidationError } from '../../shared/errors/types/error.types';

const submitSchema = z.object({
  token: z.string().min(16),
  ratings: z.record(z.number().int().min(1).max(5)),
  comment: z.string().max(2000).optional(),
});

const validateSchema = z.object({ token: z.string().min(16) });

const generateLinkSchema = z.object({ bookingId: z.string().uuid() });

const generateEventLinksSchema = z.object({ eventId: z.string().uuid() });

const moderateSchema = z.object({
  responseId: z.string().uuid(),
  action: z.enum(['approved', 'rejected']),
});

export class FeedbackController {
  private readonly service = new FeedbackService();

  /**
   * POST /feedback/validate — vérifier un token (public).
   */
  async validate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = validateSchema.parse(req.body);
      const data = await this.service.validateToken(token);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /feedback/submit — soumettre un avis (public).
   */
  async submit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, ratings, comment } = submitSchema.parse(req.body);
      await this.service.submitFeedback(token, { ratings, comment });
      res.json({ success: true, message: 'Merci pour votre avis !' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /admin/feedback/links — générer un lien pour une réservation (admin).
   */
  async generateLink(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { bookingId } = generateLinkSchema.parse(req.body);
      const result = await this.service.generateLink(bookingId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /admin/feedback/event-links — génère les liens d'avis pour tous les
   * présents (billet scanné) d'un événement.
   */
  async generateEventLinks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { eventId } = generateEventLinksSchema.parse(req.body);
      const result = await this.service.generateLinksForEvent(eventId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /admin/feedback — lister les avis (admin).
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(String(req.query.page ?? '1'), 10) || 1;
      const limit = parseInt(String(req.query.limit ?? '20'), 10) || 20;
      const statusParam = req.query.status as string | undefined;
      const status =
        statusParam === 'pending' || statusParam === 'approved' || statusParam === 'rejected'
          ? statusParam
          : undefined;
      const result = await this.service.listFeedback({ page, limit, status });
      res.json({
        success: true,
        data: result.responses,
        meta: { total: result.total, page, limit },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /admin/feedback/moderate — modérer un avis (admin).
   */
  async moderate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { responseId, action } = moderateSchema.parse(req.body);
      const adminId = req.user?.userId;
      if (!adminId) throw new ValidationError('Admin requis');
      await this.service.moderate(responseId, action, adminId);
      res.json({ success: true, message: 'Avis modere' });
    } catch (error) {
      next(error);
    }
  }
}
