/**
 * Client Prisma singleton (export direct `prisma`).
 * Importé partout via : `import { prisma } from '../config/database';`
 */

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === 'development'
      ? ['query', 'warn', 'error']
      : ['warn', 'error'],
});

/**
 * Déconnexion propre du pool Prisma (appelée au shutdown).
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
