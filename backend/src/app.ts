/**
 * Configuration de l'application Express.
 * Toutes les routes métier sont en POST (cf. règle sécurité).
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import {
  errorHandler,
  notFoundHandler,
} from './domains/shared/errors/handlers/error.handler.js';

import bookingRoutes from './domains/booking/routes/booking.routes.js';
import ticketsRoutes from './domains/tickets/routes/tickets.routes.js';
import scanRoutes from './domains/scan/routes/scan.routes.js';
import feedbackRoutes from './domains/feedback/routes/feedback.routes.js';
import paymentsRoutes from './domains/payments/routes/payments.routes.js';

export function createApp(): express.Express {
  const app = express();

  // Sécurité réseau
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
      credentials: true,
    }),
  );

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false }));

  // Logs HTTP
  app.use(pinoHttp({ logger }));

  // Rate limiting global
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Healthcheck (seul GET autorisé — non sensible)
  app.get(`${env.API_BASE_PATH}/health`, (_req, res) => {
    res.json({ success: true, data: { status: 'ok', uptime: process.uptime() } });
  });

  // Routes métier (toutes en POST)
  app.use(`${env.API_BASE_PATH}/booking`, bookingRoutes);
  app.use(`${env.API_BASE_PATH}/tickets`, ticketsRoutes);
  app.use(`${env.API_BASE_PATH}/scan`, scanRoutes);
  app.use(`${env.API_BASE_PATH}/feedback`, feedbackRoutes);
  app.use(`${env.API_BASE_PATH}/payments`, paymentsRoutes);

  // 404 + erreur
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
