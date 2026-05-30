/**
 * Middleware d'authentification + autorisation par rôle.
 *  - `authMiddleware` : vérifie le Bearer JWT et attache `req.user`.
 *  - `requireRole(...roles)` : restreint l'accès aux rôles listés.
 */

import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type TokenPayload } from '../services/jwt.service';
import { UnauthorizedError, ForbiddenError } from '../../errors/types/error.types';

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
