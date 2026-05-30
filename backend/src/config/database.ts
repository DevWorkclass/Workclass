/**
 * Client Prisma singleton — accès PostgreSQL côté backend.
 * Le `PrismaClient` est instancié une seule fois et réutilisé partout
 * (les repositories l'importent via `getPrismaClient()`).
 */

import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

let cached: PrismaClient | null = null;

export function getPrismaClient(): PrismaClient {
  if (cached) return cached;
  cached = new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? ['query', 'warn', 'error']
        : ['warn', 'error'],
  });
  return cached;
}

/**
 * Déconnexion propre du pool Prisma (à appeler dans le shutdown).
 */
export async function disconnectPrisma(): Promise<void> {
  if (!cached) return;
  await cached.$disconnect();
  cached = null;
}
