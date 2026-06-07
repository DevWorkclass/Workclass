/**
 * Routes exports (montées sous /api dans app.ts).
 *  - POST /admin/bookings/export     : export réservations (CSV/PDF)
 *  - POST /admin/participants/export : export participants (CSV/PDF)
 * Protégées par `bookings:read` (lecture des données de réservation).
 */

import { Router } from 'express';
import { ExportsController } from '../controllers/exports.controller';
import {
  authMiddleware,
  requirePermission,
} from '../../shared/auth/middleware/auth.middleware';
import { PERMISSIONS } from '../../users/types/users.types';

const router = Router();
const controller = new ExportsController();

const guard = [authMiddleware, requirePermission(PERMISSIONS.BOOKINGS_READ)];

router.post('/admin/bookings/export', ...guard, controller.bookings.bind(controller));
router.post('/admin/participants/export', ...guard, controller.participants.bind(controller));

export { router as exportsRoutes };
