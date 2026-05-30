/**
 * Handler d'erreurs centralisé. Gère AppError + ZodError.
 */

import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { logger } from '../../../../utils/logger.js';
import { AppError } from '../types/error.types.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      error: { code: 'validation_error', message: 'Données invalides', issues: err.issues },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    success: false,
    error: { code: 'internal_error', message: 'Erreur interne' },
  });
};

export const notFoundHandler: import('express').RequestHandler = (_req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'not_found', message: 'Ressource introuvable' },
  });
};
