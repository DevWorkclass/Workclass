'use client';

/**
 * Admin — Événements. Branché backend.
 *  - Liste : GET /api/events (tous les événements, tri par date de création)
 *  - Modal certificats : GET /api/admin/scan/event/:id/scanned
 *                        POST /api/admin/scan/certificates
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Award, Search, X } from 'lucide-react';

import { Badge, type BadgeTone } from '@/components/admin/Badge';
import { PageHeader } from '@/components/admin/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ROUTES } from '@/constants/routes';
import { ApiError, apiAuth } from '@/lib/api';

interface AdminEvent {
  id: string;
  title: string;
  slug: string;
  location: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'published' | 'archived';
  coverImage: string | null;
  seatsTotal: number;
  seatsSold: number;
  seatsAvailable: number;
}

interface ScannedTicket {
  id: string;
  ticketNumber: string;
  scannedAt: string;
  certificateSent: boolean;
  certificateUrl: string | null;
  booking: {
    participant: {
      firstName: string;
      lastName: string;
      email: string;
      metadata: { participants?: { firstName: string; lastName: string }[] } | null;
    } | null;
  } | null;
}

const STATUS_BADGE: Record<AdminEvent['status'], { tone: BadgeTone; label: string }> = {
  published: { tone: 'success', label: 'Publié' },
  draft: { tone: 'warning', label: 'Brouillon' },
  archived: { tone: 'neutral', label: 'Archivé' },
};

function formatRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
  const s = new Date(start).toLocaleDateString('fr-FR', opts);
  const e = new Date(end).toLocaleDateString('fr-FR', opts);
  return s === e ? s : `${s} → ${e}`;
}

function participantNames(ticket: ScannedTicket): string {
  const metaPs = ticket.booking?.participant?.metadata?.participants ?? [];
  if (metaPs.length > 0) return metaPs.map((p) => `${p.firstName} ${p.lastName}`).join(', ');
  if (ticket.booking?.participant)
    return `${ticket.booking.participant.firstName} ${ticket.booking.participant.lastName}`;
  return '—';
}

// ── Modal Certificats ─────────────────────────────────────────────────────────
interface CertModalProps {
  event: AdminEvent;
  onClose: () => void;
}

function CertificatesModal({ event, onClose }: Readonly<CertModalProps>) {
  const [tickets, setTickets] = useState<ScannedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; errors: number } | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(
    async (q = '') => {
      setLoading(true);
      try {
        const qs = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
        const res = await apiAuth<{ data: ScannedTicket[] }>(`/admin/scan/event/${event.id}/scanned${qs}`);
        setTickets(res.data);
        setSelected(new Set());
      } catch {
        setTickets([]);
      } finally {
        setLoading(false);
      }
    },
    [event.id],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const onQueryChange = (value: string) => {
    setQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => void load(value), 350);
  };

  const toggleAll = () => {
    if (selected.size === tickets.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(tickets.map((t) => t.id)));
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sendCertificates = async () => {
    if (selected.size === 0) return;
    setSending(true);
    setResult(null);
    try {
      const res = await apiAuth<{ data: { sent: number; errors: number } }>('/admin/scan/certificates', {
        method: 'POST',
        body: JSON.stringify({ ticketIds: [...selected] }),
      });
      setResult(res.data);
      setSelected(new Set());
    } catch {
      setResult({ sent: 0, errors: selected.size });
    } finally {
      setSending(false);
    }
  };

  const allChecked = tickets.length > 0 && selected.size === tickets.length;
  const indeterminate = selected.size > 0 && selected.size < tickets.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal
      aria-label={`Certificats — ${event.title}`}
    >
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-gold/15">
              <Award className="size-5 text-brand-gold" />
            </div>
            <div>
              <h2 className="font-bold text-brand-navy">Certificats — {event.title}</h2>
              <p className="text-xs text-brand-muted">Billets scannés · sélectionnez et envoyez</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-brand-muted transition-colors hover:bg-brand-cream hover:text-brand-navy"
            aria-label="Fermer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-black/5 px-6 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Rechercher un participant…"
              className="w-full rounded-full border border-black/10 bg-brand-cream py-2 pl-9 pr-4 text-sm text-brand-navy placeholder:text-brand-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
            />
          </div>
        </div>

        {/* Feedback */}
        {result && (
          <div
            className={`mx-6 mt-4 rounded-lg px-4 py-3 text-sm ${
              result.errors > 0
                ? 'bg-semantic-error/10 text-semantic-error'
                : 'bg-semantic-success/10 text-semantic-success'
            }`}
          >
            {result.sent} certificat{result.sent > 1 ? 's' : ''} envoyé{result.sent > 1 ? 's' : ''}
            {result.errors > 0 && ` · ${result.errors} erreur${result.errors > 1 ? 's' : ''}`}
          </div>
        )}

        {/* Ticket list */}
        <div className="max-h-[52vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <LoadingSpinner label="Chargement des billets scannés…" />
            </div>
          ) : tickets.length === 0 ? (
            <EmptyState
              title="Aucun billet scanné"
              description="Il n'y a pas encore de billet scanné pour cet événement."
            />
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-black/5 text-left text-xs uppercase tracking-wider text-brand-muted">
                  <th className="px-6 py-3 font-semibold">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => { if (el) el.indeterminate = indeterminate; }}
                      onChange={toggleAll}
                      className="size-4 accent-brand-gold"
                      aria-label="Tout sélectionner"
                    />
                  </th>
                  <th className="py-3 pr-4 font-semibold">Participant(s)</th>
                  <th className="hidden py-3 pr-4 font-semibold sm:table-cell">N° billet</th>
                  <th className="py-3 pr-6 text-right font-semibold">Certificat</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    className={`border-b border-black/5 transition-colors hover:bg-brand-cream/40 ${
                      selected.has(t.id) ? 'bg-brand-gold/5' : ''
                    }`}
                    onClick={() => toggle(t.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="px-6 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(t.id)}
                        onChange={() => toggle(t.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="size-4 accent-brand-gold"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-brand-navy">{participantNames(t)}</p>
                      <p className="text-xs text-brand-muted">
                        {t.booking?.participant?.email ?? ''}
                      </p>
                    </td>
                    <td className="hidden py-3 pr-4 font-mono text-xs text-brand-muted sm:table-cell">
                      {t.ticketNumber}
                    </td>
                    <td className="py-3 pr-6 text-right">
                      {t.certificateSent ? (
                        <Badge tone="success">Envoyé</Badge>
                      ) : (
                        <Badge tone="warning">En attente</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-black/5 px-6 py-4">
          <p className="text-sm text-brand-muted">
            {selected.size > 0
              ? `${selected.size} sélectionné${selected.size > 1 ? 's' : ''}`
              : `${tickets.length} billet${tickets.length > 1 ? 's' : ''} scanné${tickets.length > 1 ? 's' : ''}`}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={onClose}>
              Fermer
            </Button>
            <Button
              variant="gold"
              size="sm"
              disabled={selected.size === 0 || sending}
              onClick={() => void sendCertificates()}
            >
              {sending ? 'Envoi…' : `Envoyer ${selected.size > 0 ? `(${selected.size})` : ''}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────────────────
export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [featuredId, setFeaturedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [certEvent, setCertEvent] = useState<AdminEvent | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminEvent | null>(null);

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
      const res = await apiAuth<{ data: AdminEvent[] }>('/events');
      setEvents(res.data);
    } catch (err) {
      if (!handleAuthError(err)) setError('Impossible de charger les événements.');
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    apiAuth<{ data: { eventId: string | null } }>('/content/featured')
      .then((res) => setFeaturedId(res.data.eventId))
      .catch(() => { /* optionnel */ });
  }, []);

  const setFeatured = async (ev: AdminEvent) => {
    const next = featuredId === ev.id ? null : ev.id;
    try {
      setBusyId(ev.id);
      await apiAuth('/admin/content/featured', {
        method: 'POST',
        body: JSON.stringify({ eventId: next }),
      });
      setFeaturedId(next);
    } catch (err) {
      if (!handleAuthError(err)) setError("Impossible de définir l'événement à la une.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (ev: AdminEvent) => {
    try {
      setBusyId(ev.id);
      await apiAuth('/admin/events/delete', {
        method: 'POST',
        body: JSON.stringify({ id: ev.id }),
      });
      await load();
    } catch (err) {
      if (!handleAuthError(err)) {
        setError(
          err instanceof ApiError && err.status === 400
            ? 'Impossible de supprimer : des réservations existent.'
            : 'La suppression a échoué.',
        );
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Événements"
        subtitle="Créez et gérez vos événements"
        actions={
          <Link href={`${ROUTES.admin.events}/nouveau`}>
            <Button variant="gold" size="sm">
              + Créer un événement
            </Button>
          </Link>
        }
      />

      {loading ? (
        <div className="mt-2">
          <LoadingSpinner label="Chargement des événements…" />
        </div>
      ) : error ? (
        <p role="alert" className="rounded-md bg-semantic-error/10 p-4 text-sm text-semantic-error">
          {error}
        </p>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {events.map((ev) => (
            <article
              key={ev.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm"
            >
              <div
                className="relative aspect-[16/7] bg-brand-navy-deep bg-cover bg-center"
                style={ev.coverImage ? { backgroundImage: `url(${ev.coverImage})` } : undefined}
              >
                <span className="absolute right-4 top-4">
                  <Badge tone={STATUS_BADGE[ev.status].tone} dot>
                    {STATUS_BADGE[ev.status].label}
                  </Badge>
                </span>
                {featuredId === ev.id && (
                  <span className="absolute left-4 top-4 rounded-full bg-brand-gold px-2.5 py-0.5 text-xs font-bold text-brand-navy shadow">
                    ★ À la une
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="truncate text-lg font-bold text-brand-navy">{ev.title}</h2>
                <p className="mt-1 text-sm text-brand-muted">{formatRange(ev.startDate, ev.endDate)}</p>
                <p className="truncate text-sm text-brand-muted">{ev.location}</p>

                {/* Places disponibles */}
                <div className="mt-4">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-semibold text-brand-navy">
                      {ev.seatsAvailable} place{ev.seatsAvailable > 1 ? 's' : ''} disponible
                      {ev.seatsAvailable > 1 ? 's' : ''}
                    </span>
                    <span className="text-xs text-brand-muted">
                      {ev.seatsSold}/{ev.seatsTotal} réservées
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-brand-cream">
                    <div
                      className="h-full rounded-full bg-brand-gold"
                      style={{
                        width: `${ev.seatsTotal > 0 ? Math.round((ev.seatsSold / ev.seatsTotal) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={featuredId === ev.id ? 'gold' : 'outline'}
                      size="sm"
                      disabled={busyId === ev.id}
                      onClick={() => void setFeatured(ev)}
                      className="w-full"
                    >
                      {featuredId === ev.id ? '★ À la une' : 'Mettre à la une'}
                    </Button>
                    <Link href={`${ROUTES.admin.events}/${ev.id}/modifier`} className="block">
                      <Button variant="outline" size="sm" className="w-full">
                        Modifier
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex w-full items-center justify-center gap-1.5"
                      onClick={() => setCertEvent(ev)}
                    >
                      <Award className="size-3.5" />
                      Certificats
                    </Button>
                    <Link href={ROUTES.public.eventDetail(ev.slug)} target="_blank" className="block">
                      <Button variant="outline" size="sm" className="w-full">
                        Voir la page
                      </Button>
                    </Link>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full text-semantic-error"
                    disabled={busyId === ev.id}
                    onClick={() => setConfirmDelete(ev)}
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            </article>
          ))}

          <Link
            href={`${ROUTES.admin.events}/nouveau`}
            className="grid min-h-56 place-items-center rounded-2xl border-2 border-dashed border-black/10 bg-white/40 text-center transition-colors hover:border-brand-gold/50 hover:bg-white"
          >
            <span>
              <span className="mx-auto block text-3xl text-brand-muted">+</span>
              <span className="mt-2 block font-semibold text-brand-navy">
                Créer un nouvel événement
              </span>
            </span>
          </Link>

          {events.length === 0 && (
            <div className="sm:col-span-2 xl:col-span-3">
              <EmptyState title="Aucun événement" description="Commencez par créer votre premier événement." />
            </div>
          )}
        </section>
      )}

      {/* Modal certificats */}
      {certEvent && (
        <CertificatesModal event={certEvent} onClose={() => setCertEvent(null)} />
      )}

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Supprimer cet événement ?"
        description={confirmDelete ? `« ${confirmDelete.title} » sera définitivement supprimé. Cette action est irréversible.` : undefined}
        confirmLabel="Supprimer"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) void remove(confirmDelete);
          setConfirmDelete(null);
        }}
      />
    </>
  );
}
