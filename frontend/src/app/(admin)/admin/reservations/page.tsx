'use client';

/**
 * Admin — Réservations. Branché backend.
 *  - Liste   : GET  /api/admin/bookings (avec participant, événement, billet, quantité)
 *  - Valider : POST /api/admin/bookings/validate  body { id }
 *  - Annuler : POST /api/admin/bookings/cancel     body { id }
 * Regroupement par événement. Filtres et recherche côté client.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Badge, type BadgeTone } from '@/components/admin/Badge';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Button } from '@/components/ui/button';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { ExportButtons } from '@/components/admin/ExportButtons';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ROUTES } from '@/constants/routes';
import { ApiError, apiAuth } from '@/lib/api';
import { hasPermission } from '@/lib/auth';
import { useAuthUser } from '@/domains/shared/auth/hooks/useAuthUser';
import { formatPrice } from '@/lib/formatters';

type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

interface AdminBooking {
  id: string;
  reference: string;
  quantity: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  totalAmount: string | number;
  createdAt: string;
  event: { title: string } | null;
  ticketType: { name: string } | null;
  participant: { firstName: string; lastName: string; email: string } | null;
}

type StatusFilter = 'all' | BookingStatus;

const STATUS_BADGE: Record<BookingStatus, { tone: BadgeTone; label: string }> = {
  confirmed: { tone: 'success', label: 'Confirmé' },
  pending: { tone: 'warning', label: 'En attente' },
  cancelled: { tone: 'error', label: 'Annulé' },
};

const PAYMENT_BADGE: Record<PaymentStatus, { tone: BadgeTone; label: string }> = {
  paid: { tone: 'success', label: 'Payé' },
  pending: { tone: 'warning', label: 'En attente' },
  failed: { tone: 'error', label: 'Échec' },
  refunded: { tone: 'neutral', label: 'Remboursé' },
};

export default function AdminBookingsPage() {
  return (
    <PermissionGuard permission="bookings:read">
      <BookingsContent />
    </PermissionGuard>
  );
}

function BookingsContent() {
  const router = useRouter();
  const { user } = useAuthUser();
  const canWrite = hasPermission(user, 'bookings:write');

  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

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

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiAuth<{ data: AdminBooking[] }>('/admin/bookings?limit=200');
      setBookings(res.data);
    } catch (err) {
      if (!handleAuthError(err)) setError('Impossible de charger les réservations.');
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  useEffect(() => {
    void load();
  }, [load]);

  const act = async (id: string, action: 'validate' | 'cancel') => {
    try {
      setBusyId(id);
      await apiAuth(`/admin/bookings/${action}`, {
        method: 'POST',
        body: JSON.stringify({ id }),
      });
      await load();
    } catch (err) {
      if (!handleAuthError(err)) setError("L'action a échoué.");
    } finally {
      setBusyId(null);
    }
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((b) => {
      const name = b.participant ? `${b.participant.firstName} ${b.participant.lastName}` : '';
      const matchQuery =
        !q ||
        [b.reference, name, b.participant?.email ?? ''].some((v) => v.toLowerCase().includes(q));
      const matchStatus = status === 'all' || b.status === status;
      return matchQuery && matchStatus;
    });
  }, [bookings, query, status]);

  const groups = useMemo(() => {
    const map = new Map<string, AdminBooking[]>();
    for (const b of rows) {
      const key = b.event?.title ?? 'Sans événement';
      const list = map.get(key) ?? [];
      list.push(b);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  const counts = useMemo(
    () => ({
      confirmed: bookings.filter((b) => b.status === 'confirmed').length,
      pending: bookings.filter((b) => b.status === 'pending').length,
      cancelled: bookings.filter((b) => b.status === 'cancelled').length,
    }),
    [bookings],
  );

  const selectClass =
    'rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold';

  return (
    <>
      <PageHeader
        title="Réservations"
        subtitle={`Gestion centralisée — ${bookings.length} réservation${bookings.length > 1 ? 's' : ''}`}
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
        <StatCard label="Total" value={bookings.length} accent="blue" />
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

      {loading ? (
        <div className="mt-6">
          <LoadingSpinner label="Chargement des réservations…" />
        </div>
      ) : error ? (
        <p role="alert" className="mt-4 rounded-md bg-semantic-error/10 p-4 text-sm text-semantic-error">
          {error}
        </p>
      ) : groups.length === 0 ? (
        <section className="mt-4 rounded-2xl border border-black/5 bg-white shadow-sm">
          <EmptyState title="Aucune réservation" description="Aucune réservation ne correspond aux filtres." />
        </section>
      ) : (
        <div className="mt-4 space-y-6">
          {groups.map(([eventName, list]) => (
            <section key={eventName} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="min-w-0 truncate font-bold text-brand-navy">{eventName}</h3>
                <Badge tone="info">
                  {list.length} réservation{list.length > 1 ? 's' : ''}
                </Badge>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-brand-muted">
                      <th className="pb-3 font-semibold">Référence</th>
                      <th className="pb-3 font-semibold">Participant</th>
                      <th className="pb-3 font-semibold">Billet</th>
                      <th className="hidden pb-3 font-semibold sm:table-cell">Paiement</th>
                      <th className="pb-3 font-semibold">Statut</th>
                      <th className="pb-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((b) => (
                      <tr key={b.id} className="border-t border-black/5 align-top">
                        <td className="py-3 pr-2 font-mono text-xs text-brand-navy">{b.reference}</td>
                        <td className="max-w-[180px] py-3 pr-2">
                          <p className="truncate font-semibold text-brand-navy">
                            {b.participant
                              ? `${b.participant.firstName} ${b.participant.lastName}`
                              : '—'}
                          </p>
                          <p className="truncate text-xs text-brand-muted">
                            {b.participant?.email ?? ''}
                          </p>
                        </td>
                        <td className="py-3 pr-2 text-brand-navy">
                          <span className="block truncate">{b.ticketType?.name ?? '—'}</span>
                          <span className="block text-xs text-brand-muted">
                            ×{b.quantity} · {formatPrice(Number(b.totalAmount))}
                          </span>
                        </td>
                        <td className="hidden py-3 pr-2 sm:table-cell">
                          <Badge tone={PAYMENT_BADGE[b.paymentStatus].tone}>
                            {PAYMENT_BADGE[b.paymentStatus].label}
                          </Badge>
                        </td>
                        <td className="py-3 pr-2">
                          <Badge tone={STATUS_BADGE[b.status].tone} dot>
                            {STATUS_BADGE[b.status].label}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          {canWrite && b.status === 'pending' ? (
                            <div className="flex justify-end gap-1.5">
                              <Button
                                variant="gold"
                                size="sm"
                                disabled={busyId === b.id}
                                onClick={() => act(b.id, 'validate')}
                              >
                                Valider
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-semantic-error"
                                disabled={busyId === b.id}
                                onClick={() => act(b.id, 'cancel')}
                              >
                                Annuler
                              </Button>
                            </div>
                          ) : canWrite && b.status === 'confirmed' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-semantic-error"
                              disabled={busyId === b.id}
                              onClick={() => act(b.id, 'cancel')}
                            >
                              Annuler
                            </Button>
                          ) : (
                            <span className="text-xs text-brand-muted">—</span>
                          )}
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
