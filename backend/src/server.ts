/**
 * Point d'entrée du serveur Express.
 * Démarre l'app, enregistre les jobs cron et gère le shutdown propre
 * (ferme HTTP server, déconnecte Prisma + Redis).
 */

import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { registerJobs } from './jobs/index.js';
import { disconnectPrisma } from './config/database.js';
import { disconnectRedis } from './config/redis.js';

const app = createApp();

registerJobs();

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Backend Work Class démarré');
});

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Arrêt du serveur…');

  // Force-exit si on dépasse le timeout (évite les serveurs zombies).
  const forceExit = setTimeout(() => {
    logger.error('Shutdown timeout dépassé — exit forcé.');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  try {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
    await disconnectPrisma();
    await disconnectRedis();
    logger.info('Shutdown terminé.');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Erreur durant le shutdown.');
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
