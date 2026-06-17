/**
 * Type partagé de l'agrégat KPI renvoyé par `GET /api/admin/metrics/kpi`.
 * Utilisé par le tableau de bord et la page Statistiques détaillées.
 */

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
  tdr: { conversionRate: number; fillRate: number; engagementRate: number };
  participantsByEvent: { event: string; participants: number }[];
  budgetByEvent: { event: string; amount: number }[];
  participantsByType: { type: string; participants: number }[];
  audienceSplit: { withCompany: number; individual: number };
  /** Série journalière des 30 derniers jours. */
  daily: { date: string; bookings: number; revenue: number }[];
  /** Répartition des bookings par statut. */
  bookingsByStatus: { status: string; count: number }[];
  /** Distribution des notes (1 à 5). */
  ratingsDistribution: { rating: number; count: number }[];
  /** Jauges de complétion du cycle de vie. */
  gauges: { scanRate: number; certificateRate: number; paymentRate: number };
}
