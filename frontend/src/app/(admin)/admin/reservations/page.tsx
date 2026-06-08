'use client';

/**
 * Admin — Réservations. Branché backend.
 *  - Liste       : GET  /api/admin/bookings (avec participant, événement, billet, quantité)
 *  - Valider     : POST /api/admin/bookings/validate  body { id }
 *  - Annuler     : POST /api/admin/bookings/cancel     body { id }
 *  - Créer       : POST /api/bookings (endpoint public)
 * Regroupement par événement. Filtres et recherche côté client.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Plus, X } from 'lucide-react';

import { Badge, type BadgeTone } from '@/components/admin/Badge';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Button } from '@/components/ui/button';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { ExportButtons } from '@/components/admin/ExportButtons';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ROUTES } from '@/constants/routes';
import { ApiError, apiAuth, apiFetch } from '@/lib/api';
import { hasPermission } from '@/lib/auth';
import { useAuthUser } from '@/domains/shared/auth/hooks/useAuthUser';
import { formatPrice } from '@/lib/formatters';

type BookingStatus = 'pending' | 'confirmed' | 'cancelled';
type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

interface ParticipantEntry {
  firstName: string;
  lastName: string;
  email?: string;
}

interface TicketTypeOption {
  id: string;
  name: string;
  price: number;
}

interface AdminEvent {
  id: string;
  title: string;
  ticketTypes: TicketTypeOption[];
}

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
  ticket: { pdfUrl: string | null } | null;
  participant: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    metadata?: { participants?: ParticipantEntry[] };
  } | null;
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

const EMPTY_PARTICIPANT: ParticipantEntry = { firstName: '', lastName: '', email: '' };

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
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [eventId, setEventId] = useState<string>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  // ── Création réservation ──
  const [showCreate, setShowCreate] = useState(false);
  const [newEventId, setNewEventId] = useState('');
  const [newTicketTypeId, setNewTicketTypeId] = useState('');
  const [newQty, setNewQty] = useState(1);
  const [newPayerPhone, setNewPayerPhone] = useState('');
  const [newPayerName, setNewPayerName] = useState('');
  const [newParticipants, setNewParticipants] = useState<ParticipantEntry[]>([{ ...EMPTY_PARTICIPANT }]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

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
      const q = eventId !== 'all' ? `&eventId=${eventId}` : '';
      const res = await apiAuth<{ data: AdminBooking[] }>(`/admin/bookings?limit=200${q}`);
      setBookings(res.data);
    } catch (err) {
      if (!handleAuthError(err)) setError('Impossible de charger les réservations.');
    } finally {
      setLoading(false);
    }
  }, [handleAuthError, eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    apiAuth<{ data: AdminEvent[] }>('/events')
      .then((res) => setEvents(res.data))
      .catch(() => {});
  }, []);

  // Sync participants array length with quantity
  useEffect(() => {
    setNewParticipants((prev) => {
      const next = [...prev];
      while (next.length < newQty) next.push({ ...EMPTY_PARTICIPANT });
      return next.slice(0, newQty);
    });
  }, [newQty]);

  // Reset ticket type when event changes
  useEffect(() => {
    setNewTicketTypeId('');
  }, [newEventId]);

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

  const updateParticipant = (i: number, field: keyof ParticipantEntry, value: string) => {
    setNewParticipants((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value } as ParticipantEntry;
      return next;
    });
  };

  const resetCreateForm = () => {
    setNewEventId('');
    setNewTicketTypeId('');
    setNewQty(1);
    setNewPayerPhone('');
    setNewPayerName('');
    setNewParticipants([{ ...EMPTY_PARTICIPANT }]);
    setCreateError(null);
  };

  const handleCreate = async () => {
    setCreateError(null);
    if (!newEventId || !newTicketTypeId || !newPayerPhone.trim()) {
      setCreateError('Veuillez remplir tous les champs obligatoires (événement, type de billet, téléphone).');
      return;
    }
    const participants = newParticipants.slice(0, newQty);
    if (participants.some((p) => !p.firstName.trim() || !p.lastName.trim())) {
      setCreateError('Veuillez saisir le prénom et le nom de chaque participant.');
      return;
    }
    try {
      setCreating(true);
      await apiFetch('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          eventId: newEventId,
          ticketTypeId: newTicketTypeId,
          quantity: newQty,
          payerPhone: newPayerPhone.trim(),
          payerName: newPayerName.trim() || undefined,
          participants: participants.map((p) => ({
            firstName: p.firstName.trim(),
            lastName: p.lastName.trim(),
            email: p.email?.trim() || undefined,
          })),
        }),
      });
      setShowCreate(false);
      resetCreateForm();
      await load();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Erreur lors de la création de la réservation.');
    } finally {
      setCreating(false);
    }
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((b) => {
      const name = b.participant ? `${b.participant.firstName} ${b.participant.lastName}` : '';
      const participantNames =
        b.participant?.metadata?.participants
          ?.map((p) => `${p.firstName} ${p.lastName}`)
          .join(' ') ?? '';
      const matchQuery =
        !q ||
        [b.reference, name, b.participant?.email ?? '', b.participant?.phone ?? '', participantNames].some(
          (v) => v.toLowerCase().includes(q),
        );
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

  const selectedTicketTypes =
    events.find((ev) => ev.id === newEventId)?.ticketTypes ?? [];

  const selectClass =
    'rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold';

  const inputClass =
    'w-full rounded-lg border border-black/10 bg-brand-cream px-3 py-2 text-sm text-brand-navy placeholder:text-brand-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold';

  return (
    <>
      <PageHeader
        title="Réservations"
        subtitle={`Gestion centralisée — ${bookings.length} réservation${bookings.length > 1 ? 's' : ''}`}
        actions={
          <>
            {canWrite && (
              <Button variant="gold" size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="size-4" />
                Nouvelle réservation
              </Button>
            )}
            <select
              aria-label="Filtrer par événement"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className={selectClass}
            >
              <option value="all">Tous événements</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
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
              filters={{
                ...(status === 'all' ? {} : { status }),
                ...(eventId === 'all' ? {} : { eventId }),
              }}
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
                        <td className="max-w-[220px] py-3 pr-2">
                          <p className="truncate font-semibold text-brand-navy">
                            {b.participant
                              ? `${b.participant.firstName} ${b.participant.lastName}`
                              : '—'}
                          </p>
                          {b.participant?.phone && (
                            <p className="truncate text-xs font-medium text-brand-gold">
                              {b.participant.phone}
                            </p>
                          )}
                          {b.participant?.email && (
                            <p className="truncate text-xs text-brand-muted">
                              {b.participant.email}
                            </p>
                          )}
                          {(() => {
                            const ps = b.participant?.metadata?.participants;
                            if (!ps || ps.length === 0) return null;
                            return (
                              <ul className="mt-1 space-y-0.5">
                                {ps.map((p, i) => (
                                  <li key={i} className="text-xs text-brand-navy/70">
                                    · {p.firstName} {p.lastName}
                                    {p.email ? ` (${p.email})` : ''}
                                  </li>
                                ))}
                              </ul>
                            );
                          })()}
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
                          <div className="flex items-center justify-end gap-1">
                            {/* Téléchargement du billet */}
                            {b.ticket?.pdfUrl ? (
                              <a
                                href={b.ticket.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Télécharger le billet"
                                className="grid size-8 place-items-center rounded-lg text-brand-navy transition-colors hover:bg-brand-navy/5"
                              >
                                <Download className="size-4" />
                              </a>
                            ) : (
                              <span
                                title="Billet non encore généré"
                                className="grid size-8 place-items-center rounded-lg text-brand-muted/40"
                              >
                                <Download className="size-4" />
                              </span>
                            )}

                            {/* Actions statut */}
                            {canWrite && b.status === 'pending' ? (
                              <>
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
                              </>
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
                            ) : null}
                          </div>
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

      {/* ── Modal : Nouvelle réservation ── */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-12"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowCreate(false); resetCreateForm(); } }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-brand-navy">Nouvelle réservation</h2>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => { setShowCreate(false); resetCreateForm(); }}
                className="grid size-8 place-items-center rounded-lg text-brand-muted hover:bg-brand-navy/5"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Événement */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  Événement *
                </label>
                <select
                  value={newEventId}
                  onChange={(e) => setNewEventId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Sélectionner un événement</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              </div>

              {/* Type de billet */}
              {newEventId && (
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                    Type de billet *
                  </label>
                  <select
                    value={newTicketTypeId}
                    onChange={(e) => setNewTicketTypeId(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Sélectionner un type</option>
                    {selectedTicketTypes.map((tt) => (
                      <option key={tt.id} value={tt.id}>
                        {tt.name} — {formatPrice(Number(tt.price))}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quantité */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  Nombre de places *
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={newQty}
                  onChange={(e) => setNewQty(Math.max(1, Math.min(10, Number(e.target.value))))}
                  className={inputClass}
                />
              </div>

              {/* Payeur */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                    Téléphone payeur *
                  </label>
                  <input
                    type="tel"
                    placeholder="+241 07 00 00 00"
                    value={newPayerPhone}
                    onChange={(e) => setNewPayerPhone(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-muted">
                    Nom payeur
                  </label>
                  <input
                    type="text"
                    placeholder="Prénom Nom"
                    value={newPayerName}
                    onChange={(e) => setNewPayerName(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Participants */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  Participants ({newQty} place{newQty > 1 ? 's' : ''})
                </p>
                {Array.from({ length: newQty }, (_, i) => (
                  <div key={i} className="rounded-lg border border-black/5 bg-brand-cream/60 p-3">
                    <p className="mb-2 text-xs font-semibold text-brand-navy">Participant {i + 1}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="Prénom *"
                        value={newParticipants[i]?.firstName ?? ''}
                        onChange={(e) => updateParticipant(i, 'firstName', e.target.value)}
                        className={inputClass}
                      />
                      <input
                        placeholder="Nom *"
                        value={newParticipants[i]?.lastName ?? ''}
                        onChange={(e) => updateParticipant(i, 'lastName', e.target.value)}
                        className={inputClass}
                      />
                      <input
                        placeholder="Email (optionnel)"
                        type="email"
                        value={newParticipants[i]?.email ?? ''}
                        onChange={(e) => updateParticipant(i, 'email', e.target.value)}
                        className={`${inputClass} col-span-2`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {createError && (
                <p role="alert" className="rounded-lg bg-semantic-error/10 px-4 py-3 text-sm text-semantic-error">
                  {createError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowCreate(false); resetCreateForm(); }}
                >
                  Annuler
                </Button>
                <Button
                  variant="gold"
                  size="sm"
                  disabled={creating}
                  onClick={handleCreate}
                >
                  {creating ? 'Création…' : 'Créer la réservation'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
