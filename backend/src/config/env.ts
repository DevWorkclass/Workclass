/**
 * Lecture + validation des variables d'environnement backend.
 * Toute variable obligatoire est validée au boot — fail-fast si manquante.
 */

import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  API_BASE_PATH: z.string().default('/api'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // --- Base de données ---
  DATABASE_URL: z.string().url().optional(),
  DIRECT_URL: z.string().url().optional(),

  // --- Redis ---
  REDIS_URL: z.string().optional(),

  // --- Supabase (Storage — optionnel) ---
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default('documents'),

  // --- Seed admin (utilisé par seed.ts) ---
  SEED_ADMIN_PASSWORD: z.string().optional(),

  // --- Sécurité / Signature ---
  QR_HMAC_SECRET: z.string().optional(),
  FEEDBACK_TOKEN_SECRET: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default('1h'),

  // --- Emails (Resend) ---
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM_ADDRESS: z.string().email().default('no-reply@workclass-gabon.com'),
  EMAIL_FROM_NAME: z.string().default('Work Class Gabon'),

  // --- Rate limiting ---
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),

  // --- Logs ---
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
