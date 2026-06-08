import { Router } from 'express';
import { EventsController } from '../controllers/events.controller';
import { authMiddleware, requireRole } from '../../shared/auth/middleware/auth.middleware';

const router = Router();
const controller = new EventsController();

// Liste publique des événements publiés (non sensible) — AVANT le guard /events.
router.get('/public/events', controller.publicList.bind(controller));

// Protection de toutes les routes événements par authMiddleware
router.use('/events', authMiddleware);

// Seuls les admins ou super_admins peuvent créer des événements (à affiner avec requirePermission si besoin)
router.post(
  '/events',
  requireRole('admin', 'super_admin'),
  controller.create.bind(controller)
);

// Tout administrateur connecté peut voir la liste
router.get(
  '/events',
  controller.list.bind(controller)
);

// Modification / suppression : POST + body (id interne = donnée sensible, cf. AI_RULES)
router.post(
  '/admin/events/update',
  authMiddleware,
  requireRole('admin', 'super_admin'),
  controller.update.bind(controller)
);
router.post(
  '/admin/events/delete',
  authMiddleware,
  requireRole('admin', 'super_admin'),
  controller.remove.bind(controller)
);

export { router as eventsRoutes };
