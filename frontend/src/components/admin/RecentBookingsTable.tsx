'use client';

import { Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { ROUTES } from '@/constants/routes';
import type { AdminBookingRow } from '@/data/adminMockData';
import { formatAmount } from '@/lib/formatters';

import { Badge } from './Badge';

export function RecentBookingsTable({ bookings }: { bookings: AdminBookingRow[] }) {
  const [query, setQuery] = useState('');
  const filtered = query
    ? bookings.filter(
        (b) =>
          b.participant.toLowerCase().includes(query.toLowerCase()) ||
          b.ticket.toLowerCase().includes(query.toLowerCase()),
      )
    : bookings;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-bold text-brand-navy">Dernières réservations</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-brand-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-40 rounded-lg border border-black/10 bg-brand-cream/60 py-1.5 pl-8 pr-3 text-sm text-brand-navy placeholder:text-brand-muted/60 focus:outline-none focus:ring-1 focus:ring-brand-gold/50"
            />
          </div>
          <Link
            href={ROUTES.admin.bookings}
            className="whitespace-nowrap text-sm font-semibold text-brand-gold hover:underline"
          >
            Voir tout →
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-brand-muted">
              <th className="pb-3 font-semibold">Participant</th>
              <th className="pb-3 font-semibold">Billet</th>
              <th className="pb-3 font-semibold">Montant</th>
              <th className="pb-3 font-semibold">Statut</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.reference} className="border-t border-black/5">
                <td className="py-3">
                  <p className="font-semibold text-brand-navy">{b.participant}</p>
                  <p className="text-xs text-brand-muted">{b.date}</p>
                </td>
                <td className="py-3 text-brand-navy">{b.ticket}</td>
                <td className="py-3 font-semibold text-brand-gold">{formatAmount(b.amount)}</td>
                <td className="py-3">
                  {b.status === 'confirmed' ? (
                    <Badge tone="success" dot>
                      Confirmé
                    </Badge>
                  ) : (
                    <Badge tone="warning" dot>
                      En attente
                    </Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
