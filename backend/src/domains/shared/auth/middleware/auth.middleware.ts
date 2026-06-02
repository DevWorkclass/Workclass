/**
 * Middleware d'authentification + autorisation par rôle.
 *  - `authMiddleware` : vérifie le Bearer JWT et attache `req.user`.
 *  - `requireRole(...roles)` : restreint l'accès aux rôles listés.
 */

import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type TokenPayload } from '../services/jwt.service';
import { UnauthorizedError, ForbiddenError } from '../../errors/types/error.types';
import { prisma } from '../../../../config/database';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token manquant');
    }
    const token = authHeader.substring(7);
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user || !roles.includes(req.user.role)) {
        throw new ForbiddenError('Acces interdit');
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Restreint l'accès aux comptes possédant TOUTES les permissions listées.
 *  - `super_admin` passe toujours (permissions implicites).
 *  - Les permissions sont relues en base à chaque requête : une modification par
 *    un admin/super_admin prend effet immédiatement (sans attendre l'expiration du JWT).
 *  - Un compte désactivé entre-temps est bloqué ici.
 * À utiliser APRÈS `authMiddleware`.
 */
export function requirePermission(...required: string[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError('Authentification requise');

      const account = await prisma.admin.findUnique({
        where: { id: req.user.userId },
        select: { role: true, permissions: true, isActive: true },
      });
      if (!account || !account.isActive) {
        throw new ForbiddenError('Compte inactif ou introuvable');
      }
      if (account.role === 'super_admin') {
        next();
        return;
      }
      const granted = new Set(account.permissions);
      const ok = required.every((p) => granted.has(p));
      if (!ok) throw new ForbiddenError('Fonctionnalité non autorisée');
      next();
    } catch (err) {
      next(err);
    }
  };
}
