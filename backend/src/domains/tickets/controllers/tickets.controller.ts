/**
 * Contrôleur tickets.
 */

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { TicketGeneratorService } from '../services/ticket-generator.service';
import { verifyHMAC } from '../../../utils/crypto';
import { prisma } from '../../../config/database';
import { getSupabaseServiceClient } from '../../../config/supabase';
import { env } from '../../../config/env';

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

  /**
   * GET /public/tickets/:ticketNumber/download?t=<hmac>
   * Lien permanent : régénère une URL Supabase fraîche à chaque appel.
   */
  async downloadTicket(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ticketNumber = String(req.params.ticketNumber ?? '').slice(0, 30);
      const token = String(req.query.t ?? '');

      if (!verifyHMAC(`download:${ticketNumber}`, token)) {
        res.status(403).json({ success: false, error: { message: 'Lien invalide ou expiré.' } });
        return;
      }

      const ticket = await prisma.ticket.findFirst({ where: { ticketNumber } });
      if (!ticket?.pdfUrl) {
        res.status(404).json({ success: false, error: { message: 'Billet introuvable.' } });
        return;
      }

      // Supabase configuré → on régénère une URL signée fraîche (1h)
      if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = getSupabaseServiceClient();
        const objectPath = `tickets/${ticketNumber}.pdf`;
        const { data, error } = await supabase.storage
          .from(env.SUPABASE_STORAGE_BUCKET)
          .createSignedUrl(objectPath, 3600);
        if (error || !data) {
          res.status(502).json({ success: false, error: { message: 'Impossible de générer le lien.' } });
          return;
        }
        res.redirect(302, data.signedUrl);
        return;
      }

      // Fallback dev : URL locale stockée en DB
      res.redirect(302, ticket.pdfUrl);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /public/certificates/:certificateNumber/download?t=<hmac>
   * Lien permanent pour télécharger un certificat PDF.
   */
  async downloadCertificate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const certificateNumber = String(req.params.certificateNumber ?? '').slice(0, 40);
      const token = String(req.query.t ?? '');

      if (!verifyHMAC(`cert-download:${certificateNumber}`, token)) {
        res.status(403).json({ success: false, error: { message: 'Lien invalide ou expiré.' } });
        return;
      }

      if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = getSupabaseServiceClient();
        const { data, error } = await supabase.storage
          .from(env.SUPABASE_STORAGE_BUCKET)
          .createSignedUrl(`certificates/${certificateNumber}.pdf`, 3600);
        if (error || !data) {
          res.status(404).json({ success: false, error: { message: 'Certificat introuvable.' } });
          return;
        }
        res.redirect(302, data.signedUrl);
        return;
      }

      // Fallback dev : URL locale
      res.redirect(302, `/uploads/certificates/${certificateNumber}.pdf`);
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
