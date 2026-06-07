/**
 * Service metrics — compteur de visites (Redis) + agrégation des KPI du tableau
 * de bord. Toute la logique de calcul vit ici (règle : métier 100 % backend).
 *
 * Visites : compteur léger sans PII. Clé `visits:total` (cumul) + `visits:YYYY-MM-DD`
 * (par jour, TTL ~400 j) pour d'éventuelles tendances.
 */

import { redis } from '../../../config/redis';
import { prisma } from '../../../config/database';
import { logger } from '../../../utils/logger';

const VISIT_DAY_TTL_SECONDS = 60 * 60 * 24 * 400;

/** Incrémente le compteur de visites (appel public au chargement de l'app). */
export async function trackVisit(): Promise<void> {
  try {
    const day = new Date().toISOString().slice(0, 10);
    await redis.incr('visits:total');
    const dayKey = `visits:${day}`;
    await redis.incr(dayKey);
    await redis.expire(dayKey, VISIT_DAY_TTL_SECONDS);
  } catch (error) {
    // Une visite non comptée ne doit jamais casser le flow : on log seulement.
    logger.error({ err: error }, 'Erreur tracking visite');
  }
}

async function getTotalVisits(): Promise<number> {
  try {
    const raw = await redis.get('visits:total');
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

/** Ratio sûr (évite la division par zéro), arrondi à 1 décimale en %. */
function rate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function toNumber(value: { toString(): string } | null | undefined): number {
  return value ? Number(value.toString()) : 0;
}

export interface KpiSnapshot {
  totals: {
    bookings: number;
    confirmed: number;
    revenue: number;
    seatsSold: number;
    seatsTotal: number;
    seatsRemaining: number;
    participantsPresent: number;
    avgRating: number;
    reviewsCount: number;
    visits: number;
  };
  /** Les 3 KPI répondant au TDR/HCI (en %). */
  tdr: {
    conversionRate: number; // visites → réservations
    fillRate: number; // places vendues / quota
    engagementRate: number; // avis reçus / présents
  };
  participantsByEvent: { event: string; participants: number }[];
  budgetByEvent: { event: string; amount: number }[];
  participantsByType: { type: string; participants: number }[];
  audienceSplit: { withCompany: number; individual: number };
}

export class MetricsService {
  async getKpiSnapshot(): Promise<KpiSnapshot> {
    const [
      visits,
      bookingsTotal,
      confirmedCount,
      revenueAgg,
      ticketTypes,
      presentAgg,
      reviewsCount,
      approvedResponses,
      byEvent,
      byType,
      withCompany,
      events,
      ticketTypeNames,
    ] = await Promise.all([
      getTotalVisits(),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'confirmed' } }),
      prisma.booking.aggregate({ _sum: { totalAmount: true }, where: { status: 'confirmed' } }),
      prisma.ticketType.aggregate({ _sum: { soldCount: true, quota: true } }),
      prisma.booking.aggregate({ _sum: { quantity: true }, where: { ticket: { scannedAt: { not: null } } } }),
      prisma.feedbackResponse.count(),
      prisma.feedbackResponse.findMany({
        where: { moderationStatus: 'approved' },
        select: { ratings: true },
      }),
      prisma.booking.groupBy({
        by: ['eventId'],
        _sum: { quantity: true, totalAmount: true },
      }),
      prisma.booking.groupBy({
        by: ['ticketTypeId'],
        _sum: { quantity: true },
      }),
      prisma.participant.count({ where: { company: { not: null } } }),
      prisma.event.findMany({ select: { id: true, title: true } }),
      prisma.ticketType.findMany({ select: { id: true, name: true } }),
    ]);

    const seatsSold = ticketTypes._sum.soldCount ?? 0;
    const seatsTotal = ticketTypes._sum.quota ?? 0;
    const participantsPresent = presentAgg._sum.quantity ?? 0;
    const revenue = toNumber(revenueAgg._sum.totalAmount);

    const eventName = new Map(events.map((e) => [e.id, e.title]));
    const typeName = new Map(ticketTypeNames.map((t) => [t.id, t.name]));

    const participantsByEvent = byEvent.map((g) => ({
      event: eventName.get(g.eventId) ?? '—',
      participants: g._sum.quantity ?? 0,
    }));
    const budgetByEvent = byEvent.map((g) => ({
      event: eventName.get(g.eventId) ?? '—',
      amount: toNumber(g._sum.totalAmount),
    }));
    const participantsByType = byType.map((g) => ({
      type: typeName.get(g.ticketTypeId) ?? '—',
      participants: g._sum.quantity ?? 0,
    }));

    return {
      totals: {
        bookings: bookingsTotal,
        confirmed: confirmedCount,
        revenue,
        seatsSold,
        seatsTotal,
        seatsRemaining: Math.max(seatsTotal - seatsSold, 0),
        participantsPresent,
        avgRating: this.averageRating(approvedResponses),
        reviewsCount,
        visits,
      },
      tdr: {
        conversionRate: rate(bookingsTotal, visits),
        fillRate: rate(seatsSold, seatsTotal),
        engagementRate: rate(reviewsCount, participantsPresent),
      },
      participantsByEvent,
      budgetByEvent,
      participantsByType,
      audienceSplit: { withCompany, individual: Math.max(bookingsTotal - withCompany, 0) },
    };
  }

  /**
   * Note moyenne globale : moyenne de toutes les valeurs numériques des `ratings`
   * (objet critère→score) sur les avis approuvés. Arrondi à 1 décimale.
   */
  private averageRating(responses: { ratings: unknown }[]): number {
    let sum = 0;
    let count = 0;
    for (const { ratings } of responses) {
      if (ratings && typeof ratings === 'object') {
        for (const value of Object.values(ratings as Record<string, unknown>)) {
          if (typeof value === 'number' && Number.isFinite(value)) {
            sum += value;
            count += 1;
          }
        }
      }
    }
    return count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
  }
}
