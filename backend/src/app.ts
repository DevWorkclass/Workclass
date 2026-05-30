/**
 * Configuration de l'application Express.
 * Les routes domaine sont ajoutées au fur et à mesure des étapes (commits 2-7).
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFoundHandler } from './domains/shared/errors/handlers/error.handler';
import { bookingRoutes } from './domains/booking/routes/booking.routes';
import { ticketsRoutes } from './domains/tickets/routes/tickets.routes';

const app = express();

// --- Sécurité réseau ---
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  }),
);

// --- Rate-limiting global sur /api ---
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Trop de requetes, veuillez reessayer plus tard.' } },
});
app.use('/api/', limiter);

// --- Body parsing ---
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Healthcheck (non sensible — GET autorisé) ---
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// --- Routes domaine ---
app.use('/api', bookingRoutes);
app.use('/api', ticketsRoutes);

// --- 404 + handler d'erreurs (doivent rester en dernier) ---
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
