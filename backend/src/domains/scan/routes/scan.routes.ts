/**
 * Routes scan (admin uniquement).
 *  - POST /scan/verify                         : vérifie un QR sans le marquer scanné.
 *  - POST /scan/confirm                        : marque le ticket scanné + génère le certificat.
 *  - GET  /admin/scan/event/:eventId/scanned   : liste les billets scannés d'un événement.
 *  - POST /admin/scan/certificates             : génère/envoie les certificats (en masse).
 */

import { Router } from 'express';
import { ScanController } from '../controllers/scan.controller';
import {
  authMiddleware,
  requirePermission,
} from '../../shared/auth/middleware/auth.middleware';
import { PERMISSIONS } from '../../users/types/users.types';

const router = Router();
const controller = new ScanController();

router.post(
  '/scan/verify',
  authMiddleware,
  requirePermission(PERMISSIONS.SCAN),
  controller.verify.bind(controller),
);
router.post(
  '/scan/confirm',
  authMiddleware,
  requirePermission(PERMISSIONS.SCAN),
  controller.confirm.bind(controller),
);
router.get(
  '/admin/scan/event/:eventId/scanned',
  authMiddleware,
  requirePermission(PERMISSIONS.SCAN),
  controller.scannedByEvent.bind(controller),
);
router.post(
  '/admin/scan/certificates',
  authMiddleware,
  requirePermission(PERMISSIONS.SCAN),
  controller.sendCertificates.bind(controller),
);

export { router as scanRoutes };
