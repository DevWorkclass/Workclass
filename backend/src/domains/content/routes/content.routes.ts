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
  requireRole,
} from '../../shared/auth/middleware/auth.middleware';
import { PERMISSIONS } from '../../users/types/users.types';

const router = Router();
const controller = new ContentController();

// Upload en mémoire (l'image part ensuite vers Supabase Storage), limite 5 Mo.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const guard = [authMiddleware, requirePermission(PERMISSIONS.CONTENT_MANAGE)];
const guardPayments = [authMiddleware, requirePermission(PERMISSIONS.PAYMENTS_MANAGE)];

// --- Public (contenu non sensible) ---
router.get('/content/home-themes', controller.getHomeThemes.bind(controller));
router.get('/content/partners', controller.getPartners.bind(controller));
router.get('/content/app-config', controller.getAppConfig.bind(controller));
router.get('/content/testimonials', controller.getTestimonials.bind(controller));
router.get('/content/industries', controller.getIndustries.bind(controller));
router.get('/content/footer', controller.getFooter.bind(controller));
router.get('/content/payment-config', controller.getPaymentConfig.bind(controller));
router.get('/content/support', controller.getSupportConfig.bind(controller));
router.get('/content/ads', controller.getAds.bind(controller));
router.get('/content/promoters', controller.getPromoters.bind(controller));
router.get('/content/featured', controller.getFeaturedEvent.bind(controller));
router.get('/content/about', controller.getAbout.bind(controller));
router.get('/content/install-qr', controller.getInstallQR.bind(controller));

// --- Admin : gestion du contenu (guard content:manage) ---
router.post('/admin/content/home-themes', ...guard, controller.setHomeThemes.bind(controller));
router.post('/admin/content/partners', ...guard, controller.setPartners.bind(controller));
router.post('/admin/content/app-config', ...guard, controller.setAppConfig.bind(controller));
router.post('/admin/content/industries', ...guard, controller.setIndustries.bind(controller));
router.post('/admin/content/footer', ...guard, controller.setFooter.bind(controller));
router.post('/admin/content/support', ...guard, controller.setSupportConfig.bind(controller));
router.post('/admin/content/ads', ...guard, controller.setAds.bind(controller));
router.post('/admin/content/promoters', ...guard, controller.setPromoters.bind(controller));
router.post('/admin/content/about', ...guard, controller.setAbout.bind(controller));
// Événement à la une : géré par les admins qui gèrent les événements.
router.post(
  '/admin/content/featured',
  authMiddleware,
  requireRole('admin', 'super_admin'),
  controller.setFeaturedEvent.bind(controller),
);
// Paiement : permission dédiée payments:manage.
router.post('/admin/content/payment-config', ...guardPayments, controller.setPaymentConfig.bind(controller));

// Upload d'image : tout admin connecté (sert aussi aux couvertures d'événements).
router.post(
  '/admin/content/upload-image',
  authMiddleware,
  requireRole('admin', 'super_admin'),
  upload.single('image'),
  controller.uploadImage.bind(controller),
);

export { router as contentRoutes };
