/**
 * Handler d'erreurs global Express.
 * Gère AppError (statusCode + code), ZodError (422), fallback 500.
 * En dev : expose le détail (`stack`, `issues`) ; en prod : message générique.
 */

import type { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../types/error.types';
import { logger } from '../../../../utils/logger';

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const isDev = process.env.NODE_ENV === 'development';

  // Erreurs de validation Zod → 422
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Donnees invalides',
        ...(isDev && { issues: err.issues }),
      },
    });
    return;
  }

  // Erreurs métier typées → statusCode dédié
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code ?? 'APP_ERROR',
        message: err.message,
      },
    });
    return;
  }

  // Erreurs inattendues → 500 (log sans exposer la stack au client en prod)
  logger.error({ err: { name: err.name, message: err.message } }, 'Erreur non geree');
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Erreur interne du serveur',
      ...(isDev && { detail: err.message, stack: err.stack }),
    },
  });
};

/**
 * 404 catch-all (à monter après toutes les routes).
 */
export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Ressource introuvable' },
  });
};
