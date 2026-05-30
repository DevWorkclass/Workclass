/**
 * Client Redis (ioredis) — cache + rate-limit distribué.
 *
 * Comportement :
 *  - Si `REDIS_URL` est défini → client connecté, partagé via `getRedisClient()`.
 *  - Sinon → `getRedisClient()` retourne `null`. Le rate-limit retombe sur
 *    le store in-memory d'`express-rate-limit` (acceptable en dev mono-instance).
 *
 * Utilisation typique :
 *   const redis = getRedisClient();
 *   if (redis) { ... } // sinon désactiver le feature distribué
 */

import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let cached: Redis | null | undefined;

export function getRedisClient(): Redis | null {
  // `undefined` = pas encore évalué ; `null` = explicitement désactivé.
  if (cached !== undefined) return cached;

  if (!env.REDIS_URL) {
    logger.warn(
      'REDIS_URL non défini — rate-limit distribué désactivé (fallback in-memory).',
    );
    cached = null;
    return null;
  }

  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    lazyConnect: false,
  });

  client.on('error', (err) => {
    logger.error({ err }, 'Erreur Redis');
  });

  cached = client;
  return client;
}

/**
 * Fermeture propre de la connexion Redis (à appeler dans le shutdown).
 */
export async function disconnectRedis(): Promise<void> {
  if (!cached) return;
  await cached.quit();
  cached = undefined;
}
