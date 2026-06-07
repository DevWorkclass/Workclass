/**
 * Contrôleur metrics.
 *  - POST /metrics/visit   : incrémente le compteur de visites (public, sans PII).
 *  - GET  /admin/metrics/kpi : renvoie l'agrégat KPI (admin, agrégat non nominatif).
 */

import type { Request, Response, NextFunction } from 'express';
import { MetricsService, trackVisit } from '../services/metrics.service';

export class MetricsController {
  private readonly service = new MetricsService();

  async visit(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await trackVisit();
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async kpi(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await this.service.getKpiSnapshot();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
