/**
 * Middleware d'authentification admin.
 * Vérifie le Bearer JWT et attache l'utilisateur à req.
 */

import type { RequestHandler } from 'express';
import { jwtService } from '../services/jwt.service.js';
import { UserRole, type JwtPayload } from '../types/auth.types.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'unauthorized', message: 'Token manquant' },
    });
    return;
  }
  try {
    const token = header.slice('Bearer '.length);
    req.user = jwtService.verify(token);
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: { code: 'unauthorized', message: 'Token invalide' },
    });
  }
};

export const requireRole = (role: UserRole): RequestHandler => {
  return (req, res, next) => {
    if (!req.user || (req.user.role !== role && req.user.role !== UserRole.SUPER_ADMIN)) {
      res.status(403).json({
        success: false,
        error: { code: 'forbidden', message: 'Accès refusé' },
      });
      return;
    }
    next();
  };
};
