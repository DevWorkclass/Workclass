'use client';

/**
 * Admin — Avis & Feedback. Indicateurs + liste filtrable (données mock).
 */
import { useMemo, useState } from 'react';

import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Button } from '@/components/ui/button';
import { ADMIN_REVIEWS } from '@/data/adminMockData';

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-brand-gold" aria-label={`${rating} sur 5`}>
      {'★'.repeat(rating)}
      <span className="text-brand-muted/40">{'★'.repeat(5 - rating)}</span>
    </span>
  );
}

export default function AdminFeedbackPage() {
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ADMIN_REVIEWS;
    return ADMIN_REVIEWS.filter((r) =>
      [r.participant, r.comment].some((v) => v.toLowerCase().includes(q)),
    );
  }, [query]);

  return (
    <>
      <PageHeader
        title="Avis & Feedback"
        subtitle="Retours participants · Édition 2025"
        actions={
          <>
            <Button variant="outline" size="sm">
              Générer un lien
            </Button>
            <Button variant="gold" size="sm">
              Exporter
            </Button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Note globale" value="4,8" hint="★★★★★" accent="gold" />
        <StatCard label="Avis reçus" value={184} hint="↑ 81% taux de réponse" accent="green" />
        <StatCard label="Recommandent" value="96%" hint="↑ NPS exceptionnel" accent="blue" />
        <StatCard label="Score NPS" value={72} hint="Promoteurs nets" accent="red" />
      </section>

      <section className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-brand-navy">Tous les avis</h2>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            aria-label="Rechercher un avis"
            className="w-64 max-w-full rounded-full border border-black/10 bg-brand-cream px-4 py-2 text-sm text-brand-navy placeholder:text-brand-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-brand-muted">
                <th className="pb-3 font-semibold">Participant</th>
                <th className="pb-3 font-semibold">Note</th>
                <th className="pb-3 font-semibold">Commentaire</th>
                <th className="pb-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.participant}-${r.date}`} className="border-t border-black/5">
                  <td className="py-3 font-semibold text-brand-navy">{r.participant}</td>
                  <td className="py-3">
                    <Stars rating={r.rating} />
                  </td>
                  <td className="py-3 italic text-brand-muted">{r.comment}</td>
                  <td className="py-3 text-brand-navy">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
