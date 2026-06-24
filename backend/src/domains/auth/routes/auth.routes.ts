/**
 * Routes auth (montées sous /api dans app.ts).
 *  POST /auth/login   : authentification (email + mot de passe)
 *  POST /auth/refresh : régénération d'un access token
 *  GET  /auth/me      : profil + permissions du compte courant
 *
 * Le login a un rate-limit dédié plus strict (anti brute-force).
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../../shared/auth/middleware/auth.middleware';

const router = Router();
const controller = new AuthController();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 'RATE_LIMITED', message: 'Trop de tentatives, reessayez plus tard.' },
  },
});

router.post('/auth/login', loginLimiter, controller.login.bind(controller));
router.post('/auth/refresh', controller.refresh.bind(controller));
router.get('/auth/me', authMiddleware, controller.me.bind(controller));
router.post('/auth/profile', authMiddleware, controller.updateProfile.bind(controller));
router.post('/auth/password', authMiddleware, controller.changePassword.bind(controller));

export { router as authRoutes };
