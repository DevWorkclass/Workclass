'use client';

/**
 * Admin — Réservations. Gestion centralisée filtrable (données mock).
 */
import { useMemo, useState } from 'react';

import { Badge } from '@/components/admin/Badge';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Button } from '@/components/ui/button';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { ExportButtons } from '@/components/admin/ExportButtons';
import { ADMIN_BOOKINGS } from '@/data/adminMockData';
import { formatPrice } from '@/lib/formatters';

type StatusFilter = 'all' | 'confirmed' | 'pending' | 'cancelled';
type TicketFilter = 'all' | 'Standard' | 'VIP Premium';

const STATUS_BADGE = {
  confirmed: { tone: 'success' as const, label: 'Confirmé' },
  pending: { tone: 'warning' as const, label: 'En attente' },
  cancelled: { tone: 'error' as const, label: 'Annulé' },
};

const PAYMENT_BADGE = {
  paid: { tone: 'success' as const, label: 'Payé' },
  pending: { tone: 'warning' as const, label: 'En attente' },
  failed: { tone: 'error' as const, label: 'Échec' },
};

export default function AdminBookingsPage() {
  return (
    <PermissionGuard permission="bookings:read">
      <BookingsContent />
    </PermissionGuard>
  );
}

function BookingsContent() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [ticket, setTicket] = useState<TicketFilter>('all');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ADMIN_BOOKINGS.filter((b) => {
      const matchQuery =
        !q || [b.reference, b.participant, b.email].some((v) => v.toLowerCase().includes(q));
      const matchStatus = status === 'all' || b.status === status;
      const matchTicket = ticket === 'all' || b.ticket === ticket;
      return matchQuery && matchStatus && matchTicket;
    });
  }, [query, status, ticket]);

  // Regroupe les réservations filtrées par événement.
  const groups = useMemo(() => {
    const map = new Map<string, typeof rows>();
    for (const b of rows) {
      const list = map.get(b.event) ?? [];
      list.push(b);
      map.set(b.event, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  const counts = {
    confirmed: ADMIN_BOOKINGS.filter((b) => b.status === 'confirmed').length,
    pending: ADMIN_BOOKINGS.filter((b) => b.status === 'pending').length,
    cancelled: ADMIN_BOOKINGS.filter((b) => b.status === 'cancelled').length,
  };

  const selectClass =
    'rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold';

  return (
    <>
      <PageHeader
        title="Réservations"
        subtitle="Gestion centralisée — 227 réservations au total"
        actions={
          <>
            <select
              aria-label="Filtrer par statut"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              className={selectClass}
            >
              <option value="all">Tous statuts</option>
              <option value="confirmed">Confirmées</option>
              <option value="pending">En attente</option>
              <option value="cancelled">Annulées</option>
            </select>
            <select
              aria-label="Filtrer par billet"
              value={ticket}
              onChange={(e) => setTicket(e.target.value as TicketFilter)}
              className={selectClass}
            >
              <option value="all">Tous billets</option>
              <option value="Standard">Standard</option>
              <option value="VIP Premium">VIP Premium</option>
            </select>
            <ExportButtons
              path="/admin/bookings/export"
              filters={status === 'all' ? {} : { status }}
              fallbackName="reservations"
            />
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Confirmées" value={counts.confirmed} accent="green" />
        <StatCard label="En attente" value={counts.pending} accent="gold" />
        <StatCard label="Annulées" value={counts.cancelled} accent="red" />
        <StatCard label="Total" value={ADMIN_BOOKINGS.length} accent="blue" />
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-bold text-brand-navy">Réservations par événement</h2>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nom, référence, email…"
          aria-label="Rechercher une réservation"
          className="w-64 max-w-full rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-brand-navy placeholder:text-brand-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
        />
      </div>

      {groups.length === 0 ? (
        <section className="mt-4 rounded-2xl border border-black/5 bg-white p-8 text-center text-brand-muted shadow-sm">
          Aucune réservation ne correspond aux filtres.
        </section>
      ) : (
        <div className="mt-4 space-y-6">
          {groups.map(([eventName, bookings]) => (
            <section
              key={eventName}
              className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold text-brand-navy">{eventName}</h3>
                <Badge tone="info">
                  {bookings.length} réservation{bookings.length > 1 ? 's' : ''}
                </Badge>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-brand-muted">
                      <th className="pb-3 font-semibold">Référence</th>
                      <th className="pb-3 font-semibold">Participant</th>
                      <th className="pb-3 font-semibold">Billet</th>
                      <th className="pb-3 font-semibold">Paiement</th>
                      <th className="pb-3 font-semibold">Date</th>
                      <th className="pb-3 font-semibold">Statut</th>
                      <th className="pb-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.reference} className="border-t border-black/5">
                        <td className="py-3 font-mono text-xs text-brand-navy">{b.reference}</td>
                        <td className="py-3">
                          <p className="font-semibold text-brand-navy">{b.participant}</p>
                          <p className="text-xs text-brand-muted">{b.email}</p>
                        </td>
                        <td className="py-3 text-brand-navy">
                          {b.ticket}
                          <span className="block text-xs text-brand-gold">
                            {formatPrice(b.amount)}
                          </span>
                        </td>
                        <td className="py-3">
                          <Badge tone={PAYMENT_BADGE[b.paymentStatus].tone}>
                            {PAYMENT_BADGE[b.paymentStatus].label}
                          </Badge>
                        </td>
                        <td className="py-3 text-brand-navy">{b.date}</td>
                        <td className="py-3">
                          <Badge tone={STATUS_BADGE[b.status].tone} dot>
                            {STATUS_BADGE[b.status].label}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <Button variant="outline" size="sm">
                            Voir
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
