/**
 * Point d'entrée du serveur Express.
 * Bootstrap : connexion DB + Redis, écoute du port, shutdown propre.
 */

import { app } from './app';
import { prisma, disconnectPrisma } from './config/database';
import { redis, disconnectRedis } from './config/redis';
import { logger } from './utils/logger';
import { registerJobs } from './jobs';

const PORT = Number(process.env.PORT ?? 3001);

async function bootstrap(): Promise<void> {
  try {
    await prisma.$connect();
    logger.info('Connexion PostgreSQL etablie');

    await redis.ping();
    logger.info('Connexion Redis etablie');

    const server = app.listen(PORT, () => {
      logger.info(`Serveur backend demarre sur http://localhost:${PORT}`);
    });

    // Tâches planifiées (liens d'avis avant fin d'événement).
    registerJobs();

    const shutdown = async (signal: string): Promise<void> => {
      logger.info({ signal }, 'Arret du serveur en cours');
      const forceExit = setTimeout(() => {
        logger.error('Timeout shutdown depasse — exit force');
        process.exit(1);
      }, 10_000);
      forceExit.unref();

      try {
        await new Promise<void>((resolve, reject) => {
          server.close((err) => (err ? reject(err) : resolve()));
        });
        await disconnectPrisma();
        await disconnectRedis();
        logger.info('Shutdown propre termine');
        process.exit(0);
      } catch (err) {
        logger.error({ err }, 'Erreur durant le shutdown');
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => void shutdown('SIGTERM'));
    process.on('SIGINT', () => void shutdown('SIGINT'));
  } catch (error) {
    logger.error({ err: error }, 'Erreur au demarrage');
    process.exit(1);
  }
}

void bootstrap();
