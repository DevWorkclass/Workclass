/**
 * Tâches planifiées.
 *  - Envoi des liens d'avis ~1h avant la fin des événements (toutes les 15 min).
 * Planification simple par setInterval (pas de dépendance cron) ; les jobs sont
 * idempotents donc un éventuel chevauchement au redémarrage est sans effet.
 */

import { logger } from '../utils/logger.js';
import { sendFeedbackLinksForEndingEvents } from './feedback-links.job.js';

const FIFTEEN_MIN_MS = 15 * 60 * 1000;

export function registerJobs(): void {
  const run = () => {
    sendFeedbackLinksForEndingEvents().catch((err) =>
      logger.error({ err }, 'Job liens avis : echec'),
    );
  };

  // Premier passage peu après le démarrage, puis toutes les 15 minutes.
  setTimeout(run, 30_000);
  const timer = setInterval(run, FIFTEEN_MIN_MS);
  timer.unref();

  logger.info("Jobs cron : envoi des liens d'avis actif (toutes les 15 min).");
}
