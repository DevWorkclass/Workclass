/**
 * Routes tickets (admin uniquement).
 *  - POST /tickets/generate : génère le billet d'une réservation confirmée.
 */

import { Router } from 'express';
import { TicketsController } from '../controllers/tickets.controller';
import {
  authMiddleware,
  requireRole,
} from '../../shared/auth/middleware/auth.middleware';

const router = Router();
const controller = new TicketsController();

router.post(
  '/tickets/generate',
  authMiddleware,
  requireRole('admin', 'super_admin'),
  controller.generate.bind(controller),
);

export { router as ticketsRoutes };
