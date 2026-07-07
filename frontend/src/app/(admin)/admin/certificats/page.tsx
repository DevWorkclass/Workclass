'use client';

/**
 * Admin — Certificats. Envoi manuel à la demande.
 *  - Liste : GET  /api/admin/tickets (billets + état certificat + présence scannée)
 *  - Envoi : POST /api/admin/scan/certificates  body { ticketIds: string[] }
 *
 * Règle métier : depuis le scan, les certificats ne sont PLUS envoyés
 * automatiquement. Un admin déclenche l'envoi :
 *  - "Envoyer" par ligne (un participant) ;
 *  - "Envoyer tous les certificats" par événement (tous les scannés non envoyés).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Send } from 'lucide-react';

import { Badge } from '@/components/admin/Badge';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Pagination, paginate } from '@/components/admin/Pagination';
import { ROUTES } from '@/constants/routes';
import { ApiError, apiAuth } from '@/lib/api';

interface AdminTicket {
  id: string;
  ticketNumber: string;
  scannedAt: string | null;
  certificateSent: boolean;
  certificateUrl: string | null;
  booking: {
    event: { id: string; title: string } | null;
    participant: { firstName: string; lastName: string } | null;
  } | null;
}

export default function AdminCertificatesPage() {
  return (
    <PermissionGuard permission="scan">
      <CertificatesContent />
    </PermissionGuard>
  );
}

function CertificatesContent() {
  const router = useRouter();
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [confirmSingle, setConfirmSingle] = useState<AdminTicket | null>(null);
  const [confirmBatch, setConfirmBatch] = useState<{ eventId: string; eventTitle: string; ticketIds: string[] } | null>(
    null,
  );

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

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiAuth<{ data: AdminTicket[] }>('/admin/tickets?limit=200')
      .then((res) => setTickets(res.data))
      .catch((err) => {
        if (!handleAuthError(err)) setError('Impossible de charger les certificats.');
      })
      .finally(() => setLoading(false));
  }, [handleAuthError]);

  useEffect(() => {
    load();
  }, [load]);

  // Liste des événements pour le filtre.
  const eventsList = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tickets) {
      if (t.booking?.event?.id) map.set(t.booking.event.id, t.booking.event.title);
    }
    return [...map.entries()].map(([id, title]) => ({ id, title }));
  }, [tickets]);

  const filtered = useMemo(
    () =>
      eventFilter === 'all'
        ? tickets
        : tickets.filter((t) => t.booking?.event?.id === eventFilter),
    [tickets, eventFilter],
  );

  const stats = useMemo(
    () => ({
      generated: filtered.filter((t) => t.certificateUrl).length,
      sent: filtered.filter((t) => t.certificateSent).length,
      present: filtered.filter((t) => t.scannedAt).length,
      toSend: filtered.filter((t) => t.scannedAt && !t.certificateSent).length,
    }),
    [filtered],
  );

  /** Envoie le certificat pour une liste de tickets via POST batch. */
  const sendCertificates = async (ticketIds: string[]): Promise<void> => {
    if (ticketIds.length === 0) {
      setMessage('Aucun billet éligible (présent et certificat non envoyé).');
      return;
    }
    setBusyIds((prev) => new Set([...prev, ...ticketIds]));
    setError(null);
    setMessage(null);
    try {
      const res = await apiAuth<{ data: { sent: number; errors: number } }>(
        '/admin/scan/certificates',
        {
          method: 'POST',
          body: JSON.stringify({ ticketIds }),
        },
      );
      const { sent, errors } = res.data;
      const errSuffix = errors > 0 ? ` · ${errors} erreur${errors > 1 ? 's' : ''}` : '';
      setMessage(`${sent} certificat${sent > 1 ? 's' : ''} envoyé${sent > 1 ? 's' : ''}${errSuffix}.`);
      load();
    } catch (err) {
      if (!handleAuthError(err)) setError("L'envoi a échoué.");
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        for (const id of ticketIds) next.delete(id);
        return next;
      });
    }
  };

  /** Construit la liste des ticketIds à envoyer pour un événement. */
  const eligibleForEvent = (eventId: string): { ids: string[]; title: string } => {
    const eventTickets = tickets.filter(
      (t) => t.booking?.event?.id === eventId && t.scannedAt && !t.certificateSent,
    );
    const title = tickets.find((t) => t.booking?.event?.id === eventId)?.booking?.event?.title ?? '';
    return { ids: eventTickets.map((t) => t.id), title };
  };

  const PAGE_SIZE = 15;
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [eventFilter]);
  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const pagedTickets = paginate(filtered, page, PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="Certificats"
        subtitle="Envoi manuel des certificats aux participants scannés"
      />

      <section className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard label="Présents (scannés)" value={stats.present} accent="blue" />
        <StatCard label="Envoyés" value={stats.sent} accent="green" />
        <StatCard label="À envoyer" value={stats.toSend} accent="gold" />
        <StatCard label="Générés" value={stats.generated} accent="red" />
      </section>

      <section className="mt-6 rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-brand-navy">Participants — Statut certificats</h2>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-brand-muted">Événement :</span>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                aria-label="Filtrer par événement"
                className="rounded-lg border border-black/10 bg-brand-cream px-3 py-2 text-sm text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
              >
                <option value="all">Tous</option>
                {eventsList.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            </label>
            {eventFilter !== 'all' && (
              <Button
                variant="gold"
                size="sm"
                disabled={stats.toSend === 0}
                onClick={() => {
                  const { ids, title } = eligibleForEvent(eventFilter);
                  if (ids.length > 0) setConfirmBatch({ eventId: eventFilter, eventTitle: title, ticketIds: ids });
                }}
              >
                <Send className="mr-1.5 size-4" />
                Envoyer tous les certificats ({stats.toSend})
              </Button>
            )}
          </div>
        </div>

        {message && <p className="mt-3 text-sm text-semantic-success">{message}</p>}

        {loading ? (
          <div className="mt-6">
            <LoadingSpinner label="Chargement des certificats…" />
          </div>
        ) : error ? (
          <p role="alert" className="mt-4 rounded-md bg-semantic-error/10 p-4 text-sm text-semantic-error">
            {error}
          </p>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Aucun billet"
            description="Les certificats apparaîtront après génération des billets et scan des entrées."
          />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-brand-muted">
                  <th className="pb-3 font-semibold">Participant</th>
                  <th className="hidden pb-3 font-semibold md:table-cell">Billet</th>
                  <th className="pb-3 font-semibold">Présence</th>
                  <th className="pb-3 font-semibold">Certificat</th>
                  <th className="pb-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedTickets.map((t) => {
                  const name = t.booking?.participant
                    ? `${t.booking.participant.firstName} ${t.booking.participant.lastName}`
                    : '—';
                  const canSend = !!t.scannedAt && !t.certificateSent;
                  const busy = busyIds.has(t.id);
                  return (
                    <tr key={t.id} className="border-t border-black/5 align-top">
                      <td className="max-w-[180px] py-3 pr-2">
                        <p className="truncate font-semibold text-brand-navy">{name}</p>
                        <p className="truncate text-xs text-brand-muted">
                          {t.booking?.event?.title ?? ''}
                        </p>
                      </td>
                      <td className="hidden py-3 pr-2 font-mono text-xs text-brand-navy md:table-cell">
                        {t.ticketNumber}
                      </td>
                      <td className="py-3 pr-2">
                        <Badge tone={t.scannedAt ? 'success' : 'neutral'}>
                          {t.scannedAt ? 'Confirmée' : 'À confirmer'}
                        </Badge>
                      </td>
                      <td className="py-3 pr-2">
                        <Badge tone={t.certificateSent ? 'success' : 'warning'}>
                          {t.certificateSent ? 'Envoyé' : 'En attente'}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          {canSend && (
                            <Button
                              variant="gold"
                              size="sm"
                              disabled={busy}
                              onClick={() => setConfirmSingle(t)}
                            >
                              <Mail className="mr-1 size-3.5" />
                              {busy ? 'Envoi…' : 'Envoyer'}
                            </Button>
                          )}
                          {t.certificateUrl && (
                            <a href={t.certificateUrl} target="_blank" rel="noreferrer">
                              <Button variant="outline" size="sm">
                                Télécharger
                              </Button>
                            </a>
                          )}
                          {!canSend && !t.certificateUrl && (
                            <span className="text-xs text-brand-muted">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination page={page} pageCount={pageCount} onChange={setPage} />
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmSingle !== null}
        title="Envoyer le certificat ?"
        description={
          confirmSingle?.booking?.participant
            ? `Le certificat sera généré (si nécessaire) et envoyé par email à ${confirmSingle.booking.participant.firstName} ${confirmSingle.booking.participant.lastName}.`
            : 'Le certificat sera envoyé par email au participant.'
        }
        confirmLabel="Envoyer"
        onCancel={() => setConfirmSingle(null)}
        onConfirm={() => {
          const target = confirmSingle;
          setConfirmSingle(null);
          if (target) void sendCertificates([target.id]);
        }}
      />

      <ConfirmDialog
        open={confirmBatch !== null}
        title="Envoyer tous les certificats ?"
        description={
          confirmBatch
            ? `${confirmBatch.ticketIds.length} certificat${confirmBatch.ticketIds.length > 1 ? 's' : ''} seront envoyés pour l'événement « ${confirmBatch.eventTitle} ». Uniquement les participants scannés et non encore notifiés.`
            : undefined
        }
        confirmLabel="Envoyer tout"
        onCancel={() => setConfirmBatch(null)}
        onConfirm={() => {
          const target = confirmBatch;
          setConfirmBatch(null);
          if (target) void sendCertificates(target.ticketIds);
        }}
      />
    </>
  );
}
