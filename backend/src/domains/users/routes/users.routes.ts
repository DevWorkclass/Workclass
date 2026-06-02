/**
 * Routes users (montées sous /api dans app.ts).
 * Toutes protégées par `users:manage` (super_admin l'a implicitement).
 *
 *  GET  /admin/users/permissions  : catalogue des fonctionnalités
 *  GET  /admin/users              : liste paginée
 *  POST /admin/users              : créer un compte
 *  POST /admin/users/update       : modifier (nom, rôle, actif)
 *  POST /admin/users/permissions  : (ré)attribuer les fonctionnalités
 *  POST /admin/users/activate     : réactiver
 *  POST /admin/users/deactivate   : désactiver
 *  POST /admin/users/password     : réinitialiser le mot de passe
 */

import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import {
  authMiddleware,
  requirePermission,
} from '../../shared/auth/middleware/auth.middleware';
import { PERMISSIONS } from '../types/users.types';

const router = Router();
const controller = new UsersController();

const guard = [authMiddleware, requirePermission(PERMISSIONS.USERS_MANAGE)];

router.get('/admin/users/permissions', ...guard, controller.catalog.bind(controller));
router.get('/admin/users', ...guard, controller.list.bind(controller));
router.post('/admin/users', ...guard, controller.create.bind(controller));
router.post('/admin/users/update', ...guard, controller.update.bind(controller));
router.post('/admin/users/permissions', ...guard, controller.setPermissions.bind(controller));
router.post('/admin/users/activate', ...guard, controller.activate.bind(controller));
router.post('/admin/users/deactivate', ...guard, controller.deactivate.bind(controller));
router.post('/admin/users/password', ...guard, controller.resetPassword.bind(controller));

export { router as usersRoutes };
