/**
 * Routes content (montées sous /api dans app.ts).
 *  - GET  /content/home-themes        : public (contenu non sensible).
 *  - POST /admin/content/home-themes  : guard content:manage.
 *  - POST /admin/content/upload-image : guard content:manage (multipart via multer).
 */

import { Router } from 'express';
import multer from 'multer';
import { ContentController } from '../controllers/content.controller';
import {
  authMiddleware,
  requirePermission,
} from '../../shared/auth/middleware/auth.middleware';
import { PERMISSIONS } from '../../users/types/users.types';

const router = Router();
const controller = new ContentController();

// Upload en mémoire (l'image part ensuite vers Supabase Storage), limite 5 Mo.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const guard = [authMiddleware, requirePermission(PERMISSIONS.CONTENT_MANAGE)];

router.get('/content/home-themes', controller.getHomeThemes.bind(controller));
router.post('/admin/content/home-themes', ...guard, controller.setHomeThemes.bind(controller));
router.post(
  '/admin/content/upload-image',
  ...guard,
  upload.single('image'),
  controller.uploadImage.bind(controller),
);

export { router as contentRoutes };
