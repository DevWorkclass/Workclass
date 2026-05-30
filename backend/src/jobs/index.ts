/**
 * Tâches planifiées (node-cron).
 * STUB v1 : à activer en ÉTAPE 4-5 (rappels événement, expiration tokens feedback).
 */

import { logger } from '../utils/logger.js';

export function registerJobs(): void {
  logger.info('Jobs cron : aucun job actif (stub v1).');

  // TODO ÉTAPE 4 :
  //  import cron from 'node-cron';
  //  // Rappel J-1 avant événement (tous les jours à 9h)
  //  cron.schedule('0 9 * * *', async () => { ... });
  //  // Génération liens feedback après événement
  //  cron.schedule('0 10 * * *', async () => { ... });
  //  // Purge tokens expirés (toutes les heures)
  //  cron.schedule('0 * * * *', async () => { ... });
}
