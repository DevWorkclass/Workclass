/**
 * Contrôleur scan.
 */

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ScanService } from '../services/scan.service';

const qrDataSchema = z.object({
  ticketId: z.string().uuid('ticketId invalide'),
  signature: z.string().min(1),
});

const confirmSchema = z.object({
  ticketId: z.string().uuid('ticketId invalide'),
});

const sendCertificatesSchema = z.object({
  ticketIds: z.array(z.string().uuid()).min(1, 'Au moins un ticket requis').max(200),
});

export class ScanController {
  private readonly service = new ScanService();

  async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const qrData = qrDataSchema.parse(req.body);
      const result = await this.service.verifyQR(qrData);
      res.json({ success: result.valid, data: result });
    } catch (error) {
      next(error);
    }
  }

  async confirm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ticketId } = confirmSchema.parse(req.body);
      const scannerId = req.user?.userId ?? 'system';
      const result = await this.service.confirmScan(ticketId, scannerId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /** GET /admin/scan/stats — compteurs globaux (tous événements) */
  async stats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await this.service.getScanStats();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  /** GET /admin/scan/event/:eventId/scanned?q=… — billets scannés d'un événement */
  async scannedByEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const eventId = String(req.params.eventId ?? '');
      const query = req.query.q ? String(req.query.q).slice(0, 100) : undefined;
      const tickets = await this.service.getScannedByEvent(eventId, query);
      res.json({ success: true, data: tickets });
    } catch (error) {
      next(error);
    }
  }

  /** POST /admin/scan/certificates — génère et envoie les certificats pour les ticketIds */
  async sendCertificates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ticketIds } = sendCertificatesSchema.parse(req.body);
      const result = await this.service.sendCertificates(ticketIds);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
