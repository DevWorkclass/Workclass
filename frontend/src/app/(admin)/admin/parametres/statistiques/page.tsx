'use client';

/**
 * Admin — Paramètres → Statistiques détaillées.
 * Répartitions issues de `GET /api/admin/metrics/kpi` (déplacées du tableau de bord
 * pour garder ce dernier synthétique).
 */
import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/admin/PageHeader';
import { BarList } from '@/components/admin/BarList';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { apiAuth, ApiError } from '@/lib/api';
import { formatPrice } from '@/lib/formatters';
import type { KpiSnapshot } from '@/lib/kpi';

export default function AdminStatsPage() {
  const [kpi, setKpi] = useState<KpiSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    apiAuth<{ data: KpiSnapshot }>('/admin/metrics/kpi')
      .then((res) => active && setKpi(res.data))
      .catch((err) => {
        if (!active) return;
        if (err instanceof ApiError && err.status === 401) {
          window.location.href = '/admin/login';
          return;
        }
        setError('Impossible de charger les statistiques.');
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <PageHeader
        title="Statistiques détaillées"
        subtitle="Répartitions par événement et par type de participant"
        backHref="/admin/parametres"
      />

      {loading ? (
        <LoadingSpinner label="Chargement des statistiques…" />
      ) : error ? (
        <p role="alert" className="rounded-md bg-semantic-error/10 p-4 text-sm text-semantic-error">
          {error}
        </p>
      ) : kpi ? (
        <section className="grid gap-6 lg:grid-cols-2">
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
        </section>
      ) : null}
    </>
  );
}
