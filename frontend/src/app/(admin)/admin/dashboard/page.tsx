'use client';

/**
 * Admin — Tableau de bord. KPI temps réel issus du backend (`GET /admin/metrics/kpi`).
 * Aucune logique de calcul ici : l'agrégation est faite côté serveur.
 */
import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { apiAuth, ApiError } from '@/lib/api';
import { formatPrice } from '@/lib/formatters';

interface KpiSnapshot {
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
  tdr: { conversionRate: number; fillRate: number; engagementRate: number };
  participantsByEvent: { event: string; participants: number }[];
  budgetByEvent: { event: string; amount: number }[];
  participantsByType: { type: string; participants: number }[];
  audienceSplit: { withCompany: number; individual: number };
}

/** Carte d'un KPI TDR avec jauge circulaire (valeur en %). */
function TdrCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  const pct = Math.min(Math.max(value, 0), 100);
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-5">
        <div
          className="relative grid size-24 shrink-0 place-items-center rounded-full"
          style={{ background: `conic-gradient(#C8A84B ${pct}%, #E5E7EB ${pct}% 100%)` }}
          role="img"
          aria-label={`${label} : ${value}%`}
        >
          <div className="grid size-16 place-items-center rounded-full bg-white text-lg font-extrabold text-brand-navy">
            {value}%
          </div>
        </div>
        <div>
          <h3 className="font-bold text-brand-navy">{label}</h3>
          <p className="mt-1 text-xs text-brand-muted">{hint}</p>
        </div>
      </div>
    </div>
  );
}

/** Graphe en barres horizontales (réutilisé : participants/budget par événement). */
function BarList({
  title,
  subtitle,
  items,
  format,
}: {
  title: string;
  subtitle: string;
  items: { label: string; value: number }[];
  format?: (v: number) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <h2 className="font-bold text-brand-navy">{title}</h2>
      <p className="text-sm text-brand-muted">{subtitle}</p>
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-brand-muted">Aucune donnée pour le moment.</p>
      ) : (
        <ul className="mt-5 space-y-3">
          {items.map((i) => (
            <li key={i.label} className="text-sm">
              <div className="flex items-center justify-between">
                <span className="truncate text-brand-navy">{i.label}</span>
                <span className="ml-2 shrink-0 font-bold text-brand-navy">
                  {format ? format(i.value) : i.value}
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-brand-gold/80"
                  style={{ width: `${(i.value / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
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
      <PageHeader title="Tableau de bord" subtitle="Indicateurs temps réel" />

      {loading && <p className="text-sm text-brand-muted">Chargement des indicateurs…</p>}
      {error && (
        <p role="alert" className="rounded-md bg-semantic-error/10 p-4 text-sm text-semantic-error">
          {error}
        </p>
      )}

      {kpi && (
        <>
          {/* KPI principaux */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Réservations totales" value={kpi.totals.bookings} accent="gold" />
            <StatCard
              label="Revenus générés"
              value={formatPrice(kpi.totals.revenue)}
              hint={`${kpi.totals.confirmed} confirmées`}
              accent="green"
            />
            <StatCard
              label="Places restantes"
              value={kpi.totals.seatsRemaining}
              hint={`sur ${kpi.totals.seatsTotal} au total`}
              accent="blue"
            />
            <StatCard
              label="Visites sur l'app"
              value={kpi.totals.visits}
              hint={`${kpi.totals.participantsPresent} présents scannés`}
              accent="red"
            />
          </section>

          {/* 3 KPI TDR / HCI */}
          <h2 className="mt-8 font-bold text-brand-navy">Indicateurs de performance (TDR)</h2>
          <section className="mt-3 grid gap-4 lg:grid-cols-3">
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
              hint="Avis reçus / présents"
            />
          </section>

          {/* Répartitions */}
          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <BarList
              title="Participants par événement"
              subtitle="Somme des places réservées"
              items={kpi.participantsByEvent.map((e) => ({ label: e.event, value: e.participants }))}
            />
            <BarList
              title="Budget par événement"
              subtitle="Montant total des réservations (FCFA)"
              items={kpi.budgetByEvent.map((e) => ({ label: e.event, value: e.amount }))}
              format={formatPrice}
            />
            <BarList
              title="Types de participants"
              subtitle="Par type de billet (formulaire d'inscription)"
              items={kpi.participantsByType.map((t) => ({ label: t.type, value: t.participants }))}
            />
            <BarList
              title="Profil de l'audience"
              subtitle="Entreprise vs individuel"
              items={[
                { label: 'Avec entreprise', value: kpi.audienceSplit.withCompany },
                { label: 'Individuel', value: kpi.audienceSplit.individual },
              ]}
            />
          </section>
        </>
      )}
    </>
  );
}
