/**
 * Routes tickets (admin uniquement).
 *  - POST /tickets/generate : génère le billet d'une réservation confirmée.
 */

import { Router } from 'express';
import { TicketsController } from '../controllers/tickets.controller';
import {
  authMiddleware,
  requirePermission,
} from '../../shared/auth/middleware/auth.middleware';
import { PERMISSIONS } from '../../users/types/users.types';

const router = Router();
const controller = new TicketsController();

// Vérification publique d'un certificat (scannée depuis le QR du document).
router.get('/public/certificate/:number', controller.verifyCertificate.bind(controller));

// Téléchargement permanent d'un billet PDF (lien sécurisé HMAC, sans expiry).
router.get('/public/tickets/:ticketNumber/download', controller.downloadTicket.bind(controller));

// Téléchargement permanent d'un certificat PDF.
router.get('/public/certificates/:certificateNumber/download', controller.downloadCertificate.bind(controller));

router.post(
  '/tickets/generate',
  authMiddleware,
  requirePermission(PERMISSIONS.TICKETS_GENERATE),
  controller.generate.bind(controller),
);
router.get(
  '/admin/tickets',
  authMiddleware,
  requirePermission(PERMISSIONS.TICKETS_GENERATE),
  controller.list.bind(controller),
);

export { router as ticketsRoutes };
