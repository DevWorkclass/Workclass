/**
 * Routes scan (admin uniquement).
 *  - POST /scan/verify  : vérifie un QR sans le marquer scanné.
 *  - POST /scan/confirm : marque le ticket scanné + génère le certificat.
 */

import { Router } from 'express';
import { ScanController } from '../controllers/scan.controller';
import {
  authMiddleware,
  requireRole,
} from '../../shared/auth/middleware/auth.middleware';

const router = Router();
const controller = new ScanController();

router.post(
  '/scan/verify',
  authMiddleware,
  requireRole('admin', 'super_admin'),
  controller.verify.bind(controller),
);
router.post(
  '/scan/confirm',
  authMiddleware,
  requireRole('admin', 'super_admin'),
  controller.confirm.bind(controller),
);

export { router as scanRoutes };
