import type { Request, Response, NextFunction } from 'express';
import { EventsService } from '../services/events.service';
import {
  createEventSchema,
  updateEventSchema,
  deleteEventSchema,
} from '../validators/events.validator';
import { ValidationError } from '../../shared/errors/types/error.types';
import { uploadPdf } from '../../shared/storage/storage.service';
import { buildBookletDownloadUrl } from '../../tickets/services/ticket-generator.service';
import { verifyHMAC } from '../../../utils/crypto';
import { getSupabaseServiceClient } from '../../../config/supabase';
import { env } from '../../../config/env';

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

  /**
   * POST /admin/events/booklet (multipart)
   * Téléverse le livret ressources (PDF) d'un événement. Champ fichier `booklet`,
   * `eventId` dans le body. Stocke `booklets/<eventId>.pdf` et enregistre l'URL.
   */
  async uploadBooklet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = String(req.body.eventId ?? '').trim();
      const file = req.file;
      if (!eventId) throw new ValidationError('eventId requis');
      if (!file) throw new ValidationError('Fichier PDF requis');
      if (file.mimetype !== 'application/pdf') {
        throw new ValidationError('Le livret doit être un PDF');
      }

      await uploadPdf('booklets', `${eventId}.pdf`, file.buffer);
      // On stocke le lien permanent (HMAC) servi par la route publique de téléchargement.
      const url = buildBookletDownloadUrl(eventId);
      const result = await this.service.setBooklet(eventId, url, req.user!.userId);

      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /** POST /admin/events/booklet/delete — retire le livret d'un événement. */
  async removeBooklet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = String(req.body.eventId ?? '').trim();
      if (!eventId) throw new ValidationError('eventId requis');
      const result = await this.service.setBooklet(eventId, null, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /public/events/:eventId/booklet/download?t=<hmac>
   * Lien permanent (HMAC) pour télécharger le livret ressources d'un événement.
   */
  async downloadBooklet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = String(req.params.eventId ?? '').slice(0, 64);
      const token = String(req.query.t ?? '');

      if (!verifyHMAC(`booklet-download:${eventId}`, token)) {
        res.status(403).json({ success: false, error: { message: 'Lien invalide ou expiré.' } });
        return;
      }

      if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = getSupabaseServiceClient();
        const { data, error } = await supabase.storage
          .from(env.SUPABASE_STORAGE_BUCKET)
          .createSignedUrl(`booklets/${eventId}.pdf`, 3600);
        if (error || !data) {
          res.status(404).json({ success: false, error: { message: 'Livret introuvable.' } });
          return;
        }
        res.redirect(302, data.signedUrl);
        return;
      }

      res.redirect(302, `/uploads/booklets/${eventId}.pdf`);
    } catch (err) {
      next(err);
    }
  }
}
