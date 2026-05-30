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
}
