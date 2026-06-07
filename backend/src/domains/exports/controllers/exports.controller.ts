/**
 * Contrôleur exports — déclenche la génération et renvoie le fichier en pièce
 * jointe. POST (le body peut contenir un `eventId` / filtre nominatif → règle
 * « POST pour données sensibles »).
 */

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ExportsService } from '../services/exports.service';
import { logAudit } from '../../shared/audit/services/audit.service';

const exportSchema = z.object({
  format: z.enum(['csv', 'pdf']).default('csv'),
  status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
  eventId: z.string().uuid('ID evenement invalide').optional(),
});

export class ExportsController {
  private readonly service = new ExportsService();

  async bookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { format, status, eventId } = exportSchema.parse(req.body);
      const file = await this.service.exportBookings(format, { status, eventId });
      await logAudit({
        action: 'EXPORT_BOOKINGS',
        userId: req.user?.userId,
        resource: 'booking',
        details: { format, status, eventId },
        result: 'success',
      });
      this.sendFile(res, file.filename, file.mime, file.buffer);
    } catch (error) {
      next(error);
    }
  }

  async participants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { format, eventId } = exportSchema.parse(req.body);
      const file = await this.service.exportParticipants(format, { eventId });
      await logAudit({
        action: 'EXPORT_PARTICIPANTS',
        userId: req.user?.userId,
        resource: 'participant',
        details: { format, eventId },
        result: 'success',
      });
      this.sendFile(res, file.filename, file.mime, file.buffer);
    } catch (error) {
      next(error);
    }
  }

  private sendFile(res: Response, filename: string, mime: string, buffer: Buffer): void {
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }
}
