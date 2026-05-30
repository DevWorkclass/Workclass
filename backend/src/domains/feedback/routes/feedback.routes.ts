/**
 * Routes feedback.
 *  - POST /feedback/validate  : public (vérification token avant affichage du form)
 *  - POST /feedback/submit    : public (soumission)
 *  - POST /admin/feedback/links    : admin (génère + envoie lien)
 *  - GET  /admin/feedback          : admin (liste + filtre)
 *  - POST /admin/feedback/moderate : admin (approuve/rejette)
 */

import { Router } from 'express';
import { FeedbackController } from '../controllers/feedback.controller';
import {
  authMiddleware,
  requireRole,
} from '../../shared/auth/middleware/auth.middleware';

const router = Router();
const controller = new FeedbackController();

router.post('/feedback/validate', controller.validate.bind(controller));
router.post('/feedback/submit', controller.submit.bind(controller));

router.post(
  '/admin/feedback/links',
  authMiddleware,
  requireRole('admin', 'super_admin'),
  controller.generateLink.bind(controller),
);
router.get(
  '/admin/feedback',
  authMiddleware,
  requireRole('admin', 'super_admin'),
  controller.list.bind(controller),
);
router.post(
  '/admin/feedback/moderate',
  authMiddleware,
  requireRole('admin', 'super_admin'),
  controller.moderate.bind(controller),
);

export { router as feedbackRoutes };
