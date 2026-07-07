import { Router } from 'express';
import multer from 'multer';
import { EventsController } from '../controllers/events.controller';
import { authMiddleware, requireRole } from '../../shared/auth/middleware/auth.middleware';

const router = Router();
const controller = new EventsController();

// Upload livret en mémoire (part ensuite vers Storage), limite 15 Mo.
const uploadBooklet = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

// Liste publique des événements publiés (non sensible) — AVANT le guard /events.
router.get('/public/events', controller.publicList.bind(controller));

// Téléchargement permanent du livret ressources (lien sécurisé HMAC, public).
router.get('/public/events/:eventId/booklet/download', controller.downloadBooklet.bind(controller));

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

// Livret ressources (PDF) propre à l'événement.
router.post(
  '/admin/events/booklet',
  authMiddleware,
  requireRole('admin', 'super_admin'),
  uploadBooklet.single('booklet'),
  controller.uploadBooklet.bind(controller)
);
router.post(
  '/admin/events/booklet/delete',
  authMiddleware,
  requireRole('admin', 'super_admin'),
  controller.removeBooklet.bind(controller)
);

export { router as eventsRoutes };
