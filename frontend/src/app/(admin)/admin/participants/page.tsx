'use client';

/**
 * Admin — Participants. Branché backend (dérivé des réservations).
 *  - Liste : GET /api/admin/bookings (chaque réservation porte son participant + quantité)
 * Le nombre de places = somme des quantités ; les entreprises = participants avec société.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/admin/Badge';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { ExportButtons } from '@/components/admin/ExportButtons';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Pagination, paginate } from '@/components/admin/Pagination';
import { ROUTES } from '@/constants/routes';
import { ApiError, apiAuth } from '@/lib/api';

interface AdminBooking {
  id: string;
  quantity: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  event: { title: string } | null;
  ticketType: { name: string } | null;
  participant: {
    firstName: string;
    lastName: string;
    email: string;
    metadata: { participants?: { firstName: string; lastName: string; email?: string }[] } | null;
  } | null;
}

export default function AdminParticipantsPage() {
  return (
    <PermissionGuard permission="bookings:read">
      <ParticipantsContent />
    </PermissionGuard>
  );
}

function ParticipantsContent() {
  const router = useRouter();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [events, setEvents] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [eventId, setEventId] = useState<string>('all');

  const handleAuthError = useCallback(
    (err: unknown): boolean => {
      if (err instanceof ApiError && err.status === 401) {
        router.replace(ROUTES.admin.login);
        return true;
      }
      return false;
    },
    [router],
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    const q = eventId !== 'all' ? `&eventId=${eventId}` : '';
    apiAuth<{ data: AdminBooking[] }>(`/admin/bookings?limit=200${q}`)
      .then((res) => active && setBookings(res.data))
      .catch((err) => {
        if (active && !handleAuthError(err)) setError('Impossible de charger les participants.');
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [handleAuthError, eventId]);

  useEffect(() => {
    apiAuth<{ data: { id: string; title: string }[] }>('/events')
      .then((res) => setEvents(res.data.map((e) => ({ id: e.id, title: e.title }))))
      .catch(() => {
        /* filtre optionnel */
      });
  }, []);

  // Un participant individuel par personne dans metadata, ou titulaire si aucune metadata.
  const participants = useMemo(
    () =>
      bookings
        .filter((b) => b.participant && b.status !== 'cancelled')
        .flatMap((b) => {
          const metaPs = b.participant!.metadata?.participants ?? [];
          if (metaPs.length > 0) {
            return metaPs.map((p, i) => ({
              id: `${b.id}-${i}`,
              name: `${p.firstName} ${p.lastName}`,
              email: p.email ?? b.participant!.email,
              ticket: b.ticketType?.name ?? '—',
              event: b.event?.title ?? '—',
              status: b.status,
            }));
          }
          return [
            {
              id: b.id,
              name: `${b.participant!.firstName} ${b.participant!.lastName}`,
              email: b.participant!.email,
              ticket: b.ticketType?.name ?? '—',
              event: b.event?.title ?? '—',
              status: b.status,
            },
          ];
        }),
    [bookings],
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return participants;
    return participants.filter((p) =>
      [p.name, p.email].some((v) => v.toLowerCase().includes(q)),
    );
  }, [participants, query]);

  const PAGE_SIZE = 15;
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [query, eventId]);
  const pageCount = Math.ceil(rows.length / PAGE_SIZE);
  const pagedRows = paginate(rows, page, PAGE_SIZE);

  const stats = useMemo(() => {
    const confirmed = participants.filter((p) => p.status === 'confirmed').length;
    return { total: participants.length, confirmed };
  }, [participants]);

  return (
    <>
      <PageHeader
        title="Participants"
        subtitle={`${stats.total} participant${stats.total > 1 ? 's' : ''}`}
        actions={
          <>
            <select
              aria-label="Filtrer par événement"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
            >
              <option value="all">Tous événements</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
            <ExportButtons
              path="/admin/participants/export"
              filters={eventId === 'all' ? {} : { eventId }}
              fallbackName="participants"
            />
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Participants" value={stats.total} accent="gold" />
        <StatCard label="Entrées confirmées" value={stats.confirmed} accent="green" />
      </section>

      <section className="mt-6 rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-brand-navy">Liste des participants</h2>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom, email…"
            aria-label="Rechercher un participant"
            className="w-64 max-w-full rounded-full border border-black/10 bg-brand-cream px-4 py-2 text-sm text-brand-navy placeholder:text-brand-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
          />
        </div>

        {loading ? (
          <div className="mt-6">
            <LoadingSpinner label="Chargement des participants…" />
          </div>
        ) : error ? (
          <p role="alert" className="mt-4 rounded-md bg-semantic-error/10 p-4 text-sm text-semantic-error">
            {error}
          </p>
        ) : rows.length === 0 ? (
          <EmptyState title="Aucun participant" description="Aucun participant ne correspond à la recherche." />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-brand-muted">
                  <th className="pb-3 font-semibold">Participant</th>
                  <th className="hidden pb-3 font-semibold md:table-cell">Événement</th>
                  <th className="pb-3 font-semibold">Billet</th>
                  <th className="pb-3 text-right font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((p) => (
                  <tr key={p.id} className="border-t border-black/5 align-top">
                    <td className="max-w-[200px] py-3 pr-2">
                      <p className="truncate font-semibold text-brand-navy">{p.name}</p>
                      <p className="truncate text-xs text-brand-muted">{p.email}</p>
                    </td>
                    <td className="hidden max-w-[160px] py-3 pr-2 md:table-cell">
                      <span className="block truncate text-brand-navy">{p.event}</span>
                    </td>
                    <td className="py-3 pr-2 text-brand-navy">
                      <span className="block truncate">{p.ticket}</span>
                    </td>
                    <td className="py-3 text-right">
                      <Badge tone={p.status === 'confirmed' ? 'success' : 'warning'}>
                        {p.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} pageCount={pageCount} onChange={setPage} />
          </div>
        )}
      </section>
    </>
  );
}
