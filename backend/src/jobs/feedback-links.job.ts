/**
 * Job — envoi des liens d'avis ~1h avant la fin de chaque événement.
 *
 * Process (identique pour chaque événement) :
 *  - cible les événements publiés dont la fin est dans la prochaine heure ;
 *  - pour chaque réservation confirmée DONT LE BILLET A ÉTÉ SCANNÉ (participant présent)
 *    et qui n'a pas déjà de lien d'avis, génère un lien + envoie l'email.
 * Idempotent : le filtre `feedbackLinks: { none: {} }` évite les doublons entre exécutions.
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { FeedbackService } from '../domains/feedback/services/feedback.service';

const feedbackService = new FeedbackService();

export async function sendFeedbackLinksForEndingEvents(): Promise<void> {
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

  const events = await prisma.event.findMany({
    where: { status: 'published', endDate: { gt: now, lte: inOneHour } },
    select: { id: true, title: true },
  });
  if (events.length === 0) return;

  for (const event of events) {
    const bookings = await prisma.booking.findMany({
      where: {
        eventId: event.id,
        status: 'confirmed',
        ticket: { scannedAt: { not: null } },
        feedbackLinks: { none: {} },
      },
      select: { id: true },
    });

    for (const booking of bookings) {
      try {
        await feedbackService.generateLink(booking.id);
      } catch (err) {
        logger.error({ err, bookingId: booking.id }, 'Echec envoi lien avis');
      }
    }

    if (bookings.length > 0) {
      logger.info({ eventId: event.id, count: bookings.length }, 'Liens avis envoyes');
    }
  }
}
