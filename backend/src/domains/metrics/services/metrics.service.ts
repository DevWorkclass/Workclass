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
    pending: number;
    revenue: number;
    seatsSold: number;
    seatsPending: number;
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
  /** Série journalière des 30 derniers jours (jours sans booking inclus = 0). */
  daily: { date: string; bookings: number; revenue: number }[];
  /** Répartition des bookings par statut. */
  bookingsByStatus: { status: string; count: number }[];
  /** Distribution des notes individuelles d'avis approuvés (1 à 5). */
  ratingsDistribution: { rating: number; count: number }[];
  /** Jauges de complétion du cycle de vie d'une réservation. */
  gauges: {
    scanRate: number; // billets scannés / billets émis
    certificateRate: number; // certificats envoyés / billets scannés
    paymentRate: number; // bookings confirmés / bookings totaux
  };
}

export class MetricsService {
  async getKpiSnapshot(): Promise<KpiSnapshot> {
    const [
      visits,
      bookingsTotal,
      confirmedCount,
      pendingCount,
      revenueAgg,
      ticketTypes,
      seatsSoldAgg,
      seatsPendingAgg,
      presentAgg,
      reviewsCount,
      approvedResponses,
      byEvent,
      byType,
      byStatus,
      withCompany,
      events,
      ticketTypeNames,
      dailySeries,
      ticketsTotal,
      certificatesSent,
    ] = await Promise.all([
      getTotalVisits(),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'confirmed' } }),
      prisma.booking.count({ where: { status: 'pending' } }),
      prisma.booking.aggregate({ _sum: { totalAmount: true }, where: { status: 'confirmed' } }),
      // Quota total uniquement (la place vendue est calculée en LIVE depuis bookings).
      prisma.ticketType.aggregate({ _sum: { quota: true } }),
      // Places réellement VENDUES = bookings confirmées seulement.
      prisma.booking.aggregate({
        _sum: { quantity: true },
        where: { status: 'confirmed' },
      }),
      // Places en ATTENTE de validation = bookings pending (info séparée).
      prisma.booking.aggregate({
        _sum: { quantity: true },
        where: { status: 'pending' },
      }),
      prisma.booking.aggregate({ _sum: { quantity: true }, where: { ticket: { scannedAt: { not: null } } } }),
      prisma.feedbackResponse.count(),
      prisma.feedbackResponse.findMany({
        where: { moderationStatus: 'approved' },
        select: { ratings: true },
      }),
      prisma.booking.groupBy({
        by: ['eventId'],
        _sum: { quantity: true, totalAmount: true },
        where: { status: { not: 'cancelled' } },
      }),
      prisma.booking.groupBy({
        by: ['ticketTypeId'],
        _sum: { quantity: true },
        where: { status: { not: 'cancelled' } },
      }),
      prisma.booking.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.participant.count({ where: { company: { not: null } } }),
      prisma.event.findMany({ select: { id: true, title: true } }),
      prisma.ticketType.findMany({ select: { id: true, name: true } }),
      prisma.$queryRaw<{ day: Date; bookings: bigint; revenue: string | null }[]>`
        SELECT date_trunc('day', created_at) AS day,
               COUNT(*)::bigint AS bookings,
               COALESCE(SUM(total_amount), 0)::text AS revenue
        FROM bookings
        WHERE created_at >= NOW() - INTERVAL '29 days'
          AND status != 'cancelled'
        GROUP BY day
        ORDER BY day ASC
      `,
      prisma.ticket.count(),
      prisma.ticket.count({ where: { certificateSent: true } }),
    ]);

    const seatsSold = seatsSoldAgg._sum.quantity ?? 0;
    const seatsPending = seatsPendingAgg._sum.quantity ?? 0;
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

    // Série journalière : on assure 30 points (J-29 → J), jours sans booking = 0.
    const dailyMap = new Map<string, { bookings: number; revenue: number }>();
    for (const row of dailySeries) {
      const key = new Date(row.day).toISOString().slice(0, 10);
      dailyMap.set(key, {
        bookings: Number(row.bookings),
        revenue: row.revenue ? Number(row.revenue) : 0,
      });
    }
    const daily: { date: string; bookings: number; revenue: number }[] = [];
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    for (let i = 29; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setUTCDate(today.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      const v = dailyMap.get(key) ?? { bookings: 0, revenue: 0 };
      daily.push({ date: key, bookings: v.bookings, revenue: v.revenue });
    }

    // Distribution des notes individuelles (1..5) à partir des ratings approuvés.
    const ratingsCount = new Map<number, number>([
      [1, 0], [2, 0], [3, 0], [4, 0], [5, 0],
    ]);
    for (const { ratings } of approvedResponses) {
      if (ratings && typeof ratings === 'object') {
        for (const value of Object.values(ratings as Record<string, unknown>)) {
          if (typeof value === 'number' && Number.isFinite(value)) {
            const r = Math.round(value);
            if (r >= 1 && r <= 5) ratingsCount.set(r, (ratingsCount.get(r) ?? 0) + 1);
          }
        }
      }
    }
    const ratingsDistribution = [...ratingsCount.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([rating, count]) => ({ rating, count }));

    const bookingsByStatus = byStatus.map((g) => ({
      status: g.status,
      count: g._count._all,
    }));

    return {
      totals: {
        bookings: bookingsTotal,
        confirmed: confirmedCount,
        pending: pendingCount,
        revenue,
        seatsSold,
        seatsPending,
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
        engagementRate: rate(reviewsCount, bookingsTotal),
      },
      participantsByEvent,
      budgetByEvent,
      participantsByType,
      audienceSplit: { withCompany, individual: Math.max(bookingsTotal - withCompany, 0) },
      daily,
      bookingsByStatus,
      ratingsDistribution,
      gauges: {
        scanRate: rate(participantsPresent, seatsSold),
        certificateRate: rate(certificatesSent, ticketsTotal),
        paymentRate: rate(confirmedCount, bookingsTotal),
      },
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
