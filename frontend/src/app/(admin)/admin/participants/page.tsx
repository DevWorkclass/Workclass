'use client';

/**
 * Admin — Participants. Liste filtrable + indicateurs (données mock).
 */
import { useMemo, useState } from 'react';

import { Badge } from '@/components/admin/Badge';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Button } from '@/components/ui/button';
import { ADMIN_PARTICIPANTS } from '@/data/adminMockData';

export default function AdminParticipantsPage() {
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ADMIN_PARTICIPANTS;
    return ADMIN_PARTICIPANTS.filter((p) =>
      [p.name, p.email, p.company].some((v) => v.toLowerCase().includes(q)),
    );
  }, [query]);

  return (
    <>
      <PageHeader
        title="Participants"
        subtitle="227 inscrits au Summit 2026"
        actions={
          <>
            <Button variant="outline" size="sm">
              Import
            </Button>
            <Button variant="gold" size="sm">
              Export CSV
            </Button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total inscrits" value={227} hint="↑ +14 cette semaine" accent="gold" />
        <StatCard
          label="Attentes soumises"
          value={143}
          hint="↑ 63% taux de réponse"
          accent="green"
        />
        <StatCard label="Entreprises" value={48} hint="secteurs représentés" accent="blue" />
      </section>

      <section className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-brand-navy">Liste des participants</h2>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom, email, entreprise…"
            aria-label="Rechercher un participant"
            className="w-64 max-w-full rounded-full border border-black/10 bg-brand-cream px-4 py-2 text-sm text-brand-navy placeholder:text-brand-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-brand-muted">
                <th className="pb-3 font-semibold">Participant</th>
                <th className="pb-3 font-semibold">Entreprise</th>
                <th className="pb-3 font-semibold">Billet</th>
                <th className="pb-3 font-semibold">Attentes</th>
                <th className="pb-3 font-semibold">Statut</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.email} className="border-t border-black/5">
                  <td className="py-3">
                    <p className="font-semibold text-brand-navy">{p.name}</p>
                    <p className="text-xs text-brand-muted">{p.email}</p>
                  </td>
                  <td className="py-3 text-brand-navy">{p.company}</td>
                  <td className="py-3 text-brand-navy">{p.ticket}</td>
                  <td className="py-3">
                    {p.expectationsSubmitted ? (
                      <Badge tone="success">Soumises ✓</Badge>
                    ) : (
                      <Badge tone="neutral">En attente</Badge>
                    )}
                  </td>
                  <td className="py-3">
                    {p.status === 'confirmed' ? (
                      <Badge tone="success" dot>
                        Confirmé
                      </Badge>
                    ) : (
                      <Badge tone="warning" dot>
                        En attente
                      </Badge>
                    )}
                  </td>
                  <td className="py-3">
                    <Button variant="outline" size="sm">
                      Voir
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-brand-muted">
                    Aucun participant trouvé.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
