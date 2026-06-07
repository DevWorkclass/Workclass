/**
 * Routes metrics (montées sous /api dans app.ts).
 *  - POST /metrics/visit     : public (compteur de visites, aucune donnée sensible).
 *  - GET  /admin/metrics/kpi : admin, agrégat non nominatif → guard `bookings:read`.
 */

import { Router } from 'express';
import { MetricsController } from '../controllers/metrics.controller';
import {
  authMiddleware,
  requirePermission,
} from '../../shared/auth/middleware/auth.middleware';
import { PERMISSIONS } from '../../users/types/users.types';

const router = Router();
const controller = new MetricsController();

router.post('/metrics/visit', controller.visit.bind(controller));
router.get(
  '/admin/metrics/kpi',
  authMiddleware,
  requirePermission(PERMISSIONS.BOOKINGS_READ),
  controller.kpi.bind(controller),
);

export { router as metricsRoutes };
