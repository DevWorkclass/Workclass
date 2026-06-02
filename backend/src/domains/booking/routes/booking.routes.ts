/**
 * Routes booking (montées sous /api dans app.ts).
 *  - POST /bookings              : créer une réservation
 *  - POST /bookings/lookup       : consulter par référence (donnée sensible → body)
 *  - GET  /admin/bookings        : liste paginée (admin)
 *  - POST /admin/bookings/validate : valider (admin)
 *  - POST /admin/bookings/cancel : annuler (admin)
 */

import { Router } from 'express';
import { BookingController } from '../controllers/booking.controller';
import {
  authMiddleware,
  requirePermission,
} from '../../shared/auth/middleware/auth.middleware';
import { PERMISSIONS } from '../../users/types/users.types';

const router = Router();
const controller = new BookingController();

router.post('/bookings', controller.create.bind(controller));
router.post('/bookings/lookup', controller.lookup.bind(controller));

router.get(
  '/admin/bookings',
  authMiddleware,
  requirePermission(PERMISSIONS.BOOKINGS_READ),
  controller.list.bind(controller),
);
router.post(
  '/admin/bookings/validate',
  authMiddleware,
  requirePermission(PERMISSIONS.BOOKINGS_WRITE),
  controller.validate.bind(controller),
);
router.post(
  '/admin/bookings/cancel',
  authMiddleware,
  requirePermission(PERMISSIONS.BOOKINGS_WRITE),
  controller.cancel.bind(controller),
);

export { router as bookingRoutes };
