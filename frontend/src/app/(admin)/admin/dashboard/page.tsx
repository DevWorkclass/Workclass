'use client';

/**
 * Admin — Tableau de bord. KPI temps réel issus du backend (`GET /admin/metrics/kpi`).
 * Vue illustrée : cartes synthétiques, courbes (réservations + revenus), donuts
 * (statuts + types de billets), barres (top événements), distribution des notes
 * et jauges de complétion (paiements, présences, certificats).
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CalendarPlus,
  QrCode,
  Users,
  FileDown,
  Award,
  Star,
} from 'lucide-react';

import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Button } from '@/components/ui/button';
import {
  BookingsStatusDonut,
  BookingsTrend,
  CompletionGauges,
  RatingsHistogram,
  RevenueTrend,
  TicketTypeSplit,
  TopEvents,
} from '@/components/admin/DashboardCharts';
import { ROUTES } from '@/constants/routes';
import { apiAuth, ApiError } from '@/lib/api';
import { formatPrice } from '@/lib/formatters';
import type { KpiSnapshot } from '@/lib/kpi';

/** Actions rapides du tableau de bord. */
const QUICK_ACTIONS: { label: string; href: string; icon: typeof QrCode }[] = [
  { label: 'Créer un événement', href: ROUTES.admin.events + '/nouveau', icon: CalendarPlus },
  { label: 'Scanner un billet', href: ROUTES.admin.scan, icon: QrCode },
  { label: 'Réservations', href: ROUTES.admin.bookings, icon: Users },
  { label: 'Participants', href: ROUTES.admin.participants, icon: FileDown },
  { label: 'Certificats', href: ROUTES.admin.certificates, icon: Award },
  { label: 'Avis', href: ROUTES.admin.feedback, icon: Star },
];

function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {QUICK_ACTIONS.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex flex-col items-center gap-2 rounded-2xl border border-black/5 bg-white p-4 text-center shadow-sm transition-colors hover:border-brand-gold/50 hover:bg-brand-cream/40"
        >
          <span className="grid size-10 place-items-center rounded-full bg-brand-gold/10 text-brand-gold">
            <Icon className="size-5" aria-hidden />
          </span>
          <span className="text-xs font-semibold text-brand-navy">{label}</span>
        </Link>
      ))}
    </div>
  );
}

/** Carte d'un KPI TDR avec jauge circulaire (valeur en %). */
function TdrCard({ label, value, hint }: Readonly<{ label: string; value: number; hint: string }>) {
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-center gap-3 sm:gap-5">
        <div
          className="relative grid size-20 shrink-0 place-items-center rounded-full sm:size-24"
          style={{ background: `conic-gradient(#C8A84B ${pct}%, #E5E7EB ${pct}% 100%)` }}
          role="img"
          aria-label={`${label} : ${value}%`}
        >
          <div className="grid size-14 place-items-center rounded-full bg-white text-base font-extrabold text-brand-navy sm:size-16 sm:text-lg">
            {value}%
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="whitespace-nowrap text-sm font-bold text-brand-navy">{label}</h3>
          <p className="mt-1 text-[10px] leading-tight text-brand-muted">{hint}</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [kpi, setKpi] = useState<KpiSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiAuth<{ data: KpiSnapshot }>('/admin/metrics/kpi')
      .then((res) => {
        if (active) setKpi(res.data);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          window.location.href = '/admin/login';
          return;
        }
        setError('Impossible de charger les indicateurs.');
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        subtitle="Indicateurs temps réel et tendances"
        actions={
          <Link href={`${ROUTES.admin.settings}/statistiques`}>
            <Button variant="outline" size="sm">
              Statistiques détaillées
            </Button>
          </Link>
        }
      />

      {loading && <p className="text-sm text-brand-muted">Chargement des indicateurs…</p>}
      {error && (
        <p role="alert" className="rounded-md bg-semantic-error/10 p-4 text-sm text-semantic-error">
          {error}
        </p>
      )}

      {kpi && (
        <div className="space-y-6 sm:space-y-8">
          {/* KPI principaux */}
          <section className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <StatCard label="Réservations totales" value={kpi.totals.bookings} accent="gold" />
            <StatCard
              label="Revenus générés"
              value={formatPrice(kpi.totals.revenue)}
              hint={`${kpi.totals.confirmed} confirmées`}
              accent="green"
            />
            <StatCard
              label="Participants présents"
              value={kpi.totals.participantsPresent}
              hint="entrées scannées"
              accent="blue"
            />
            <StatCard
              label="Visites sur l'app"
              value={kpi.totals.visits}
              hint={`note moyenne ${kpi.totals.avgRating || '—'}`}
              accent="red"
            />
          </section>

          {/* KPI TDR principaux */}
          <section>
            <h2 className="mb-3 font-bold text-brand-navy">Indicateurs de performance (TDR)</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <TdrCard
                label="Taux de conversion"
                value={kpi.tdr.conversionRate}
                hint="Réservations / visites"
              />
              <TdrCard
                label="Taux de remplissage"
                value={kpi.tdr.fillRate}
                hint="Places vendues / quota"
              />
              <TdrCard
                label="Taux d'engagement"
                value={kpi.tdr.engagementRate}
                hint="Avis reçus / réservations"
              />
            </div>
          </section>

          {/* Tendances temporelles */}
          <section>
            <h2 className="mb-3 font-bold text-brand-navy">Tendances — 30 derniers jours</h2>
            <div className="grid gap-3 lg:grid-cols-2">
              <BookingsTrend data={kpi.daily} />
              <RevenueTrend data={kpi.daily} />
            </div>
          </section>

          {/* Répartitions */}
          <section>
            <h2 className="mb-3 font-bold text-brand-navy">Répartitions</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <BookingsStatusDonut data={kpi.bookingsByStatus} />
              <TicketTypeSplit data={kpi.participantsByType} />
              <RatingsHistogram data={kpi.ratingsDistribution} />
            </div>
          </section>

          {/* Top événements + jauges */}
          <section>
            <h2 className="mb-3 font-bold text-brand-navy">Performances</h2>
            <div className="grid gap-3 lg:grid-cols-2">
              <TopEvents data={kpi.participantsByEvent} />
              <div className="flex flex-col gap-3">
                <CompletionGauges data={kpi.gauges} />
                <div className="grid gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-5">
                  <StatCard
                    label="Places restantes"
                    value={kpi.totals.seatsRemaining}
                    hint={`sur ${kpi.totals.seatsTotal} au total`}
                    accent="blue"
                  />
                  <StatCard
                    label="Avis reçus"
                    value={kpi.totals.reviewsCount}
                    hint={`note moyenne ${kpi.totals.avgRating || '—'} / 5`}
                    accent="gold"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Actions rapides */}
          <section>
            <h2 className="mb-3 font-bold text-brand-navy">Actions rapides</h2>
            <QuickActions />
          </section>
        </div>
      )}
    </>
  );
}
