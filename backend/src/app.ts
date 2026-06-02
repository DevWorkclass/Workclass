/**
 * Configuration de l'application Express.
 * Les routes domaine sont ajoutées au fur et à mesure des étapes (commits 2-7).
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { openapiSpec } from './docs/openapi';
import { errorHandler, notFoundHandler } from './domains/shared/errors/handlers/error.handler';
import { authRoutes } from './domains/auth/routes/auth.routes';
import { usersRoutes } from './domains/users/routes/users.routes';
import { bookingRoutes } from './domains/booking/routes/booking.routes';
import { ticketsRoutes } from './domains/tickets/routes/tickets.routes';
import { scanRoutes } from './domains/scan/routes/scan.routes';
import { feedbackRoutes } from './domains/feedback/routes/feedback.routes';
import { paymentsRoutes } from './domains/payments/routes/payments.routes';

const app = express();

// --- Confiance au reverse-proxy (Render/Vercel) ---
// Indispensable pour que `req.ip` (rate-limit, audit) reflète le client réel
// via X-Forwarded-For, et non l'IP du proxy. 1 = un seul hop de proxy.
app.set('trust proxy', 1);

// --- Sécurité réseau ---
app.use(helmet());

// Origines autorisées : CORS_ORIGIN (prioritaire) ou FRONTEND_URL, séparées par
// des virgules pour supporter plusieurs domaines (ex. prod + preview).
const corsOrigins = (
  process.env.CORS_ORIGIN ??
  process.env.FRONTEND_URL ??
  'http://localhost:3000'
)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  }),
);

// --- Documentation OpenAPI / Swagger UI ---
// Montée AVANT le rate-limiter (l'UI charge plusieurs assets) et avec une CSP
// assouplie (Swagger UI utilise des styles/scripts inline).
// Désactivable en prod via DOCS_ENABLED=false.
if (env.DOCS_ENABLED) {
  app.get('/api/docs.json', (_req, res) => res.json(openapiSpec));
  app.use(
    '/api/docs',
    helmet({ contentSecurityPolicy: false }),
    swaggerUi.serve,
    swaggerUi.setup(openapiSpec, {
      customSiteTitle: 'Work Class Gabon — API Docs',
      swaggerOptions: { persistAuthorization: true },
    }),
  );
}

// --- Rate-limiting global sur /api (paramétrable via RATE_LIMIT_*) ---
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Trop de requetes, veuillez reessayer plus tard.' } },
});
app.use('/api/', limiter);

// --- Body parsing (limite réduite : aucune route n'attend de gros payloads) ---
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// --- Fichiers générés (dev uniquement) ---
// En prod, les PDF sont poussés vers Supabase Storage (URL signée).
// En dev sans Supabase, on sert le dossier local pour que les URLs /uploads/* fonctionnent.
if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  app.use(
    '/uploads',
    express.static(process.env.LOCAL_STORAGE_PATH ?? './uploads'),
  );
}

// --- Healthcheck (non sensible — GET autorisé) ---
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// --- Routes domaine ---
app.use('/api', authRoutes);
app.use('/api', usersRoutes);
app.use('/api', bookingRoutes);
app.use('/api', ticketsRoutes);
app.use('/api', scanRoutes);
app.use('/api', feedbackRoutes);
app.use('/api', paymentsRoutes);

// --- 404 + handler d'erreurs (doivent rester en dernier) ---
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
