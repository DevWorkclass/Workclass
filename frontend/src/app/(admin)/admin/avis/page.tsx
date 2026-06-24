'use client';

/**
 * Admin — Avis & Feedback. Branché backend.
 *  - Liste    : GET  /api/admin/feedback?status=
 *  - Modérer  : POST /api/admin/feedback/moderate  body { responseId, action }
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

import { Badge, type BadgeTone } from '@/components/admin/Badge';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Button } from '@/components/ui/button';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Pagination, paginate } from '@/components/admin/Pagination';
import { ROUTES } from '@/constants/routes';
import { ApiError, apiAuth } from '@/lib/api';
import { hasPermission } from '@/lib/auth';
import { useAuthUser } from '@/domains/shared/auth/hooks/useAuthUser';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

type Moderation = 'pending' | 'approved' | 'rejected';

interface FeedbackResponse {
  id: string;
  ratings: Record<string, number>;
  comment: string | null;
  moderationStatus: Moderation;
  createdAt: string;
  feedbackLink: {
    booking: { participant: { firstName: string; lastName: string } | null } | null;
  } | null;
}

const STATUS_BADGE: Record<Moderation, { tone: BadgeTone; label: string }> = {
  pending: { tone: 'warning', label: 'En attente' },
  approved: { tone: 'success', label: 'Approuvé' },
  rejected: { tone: 'error', label: 'Rejeté' },
};

function avgRating(ratings: Record<string, number>): number {
  const values = Object.values(ratings).filter((v) => typeof v === 'number');
  if (values.length === 0) return 0;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="whitespace-nowrap text-brand-gold" aria-label={`${rating} sur 5`}>
      {'★'.repeat(full)}
      <span className="text-brand-muted/40">{'★'.repeat(Math.max(0, 5 - full))}</span>
    </span>
  );
}

export default function AdminFeedbackPage() {
  return (
    <PermissionGuard permission="feedback:read">
      <FeedbackContent />
    </PermissionGuard>
  );
}

function FeedbackContent() {
  const router = useRouter();
  const { user } = useAuthUser();
  const canModerate = hasPermission(user, 'feedback:moderate');

  const [items, setItems] = useState<FeedbackResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'all' | Moderation>('all');
  const [confirmMod, setConfirmMod] = useState<
    { id: string; action: 'approved' | 'rejected' } | null
  >(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selected, setSelected] = useState<FeedbackResponse | null>(null);

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
      const res = await apiAuth<{ data: FeedbackResponse[] }>('/admin/feedback?limit=200');
      setItems(res.data);
    } catch (err) {
      if (!handleAuthError(err)) setError('Impossible de charger les avis.');
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  useEffect(() => {
    void load();
  }, [load]);

  const moderate = async (responseId: string, action: 'approved' | 'rejected') => {
    try {
      setBusyId(responseId);
      await apiAuth('/admin/feedback/moderate', {
        method: 'POST',
        body: JSON.stringify({ responseId, action }),
      });
      await load();
    } catch (err) {
      if (!handleAuthError(err)) setError('La modération a échoué.');
    } finally {
      setBusyId(null);
    }
  };

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((r) => {
      const name = r.feedbackLink?.booking?.participant
        ? `${r.feedbackLink.booking.participant.firstName} ${r.feedbackLink.booking.participant.lastName}`
        : '';
      const matchQuery = !q || [name, r.comment ?? ''].some((v) => v.toLowerCase().includes(q));
      const matchStatus = status === 'all' || r.moderationStatus === status;
      return matchQuery && matchStatus;
    });
  }, [items, query, status]);

  const PAGE_SIZE = 12;
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [query, status]);
  const pageCount = Math.ceil(rows.length / PAGE_SIZE);
  const pagedRows = paginate(rows, page, PAGE_SIZE);

  const stats = useMemo(() => {
    const approved = items.filter((r) => r.moderationStatus === 'approved');
    const global =
      approved.length > 0
        ? Math.round(
            (approved.reduce((sum, r) => sum + avgRating(r.ratings), 0) / approved.length) * 10,
          ) / 10
        : 0;
    return {
      total: items.length,
      pending: items.filter((r) => r.moderationStatus === 'pending').length,
      approved: approved.length,
      global,
    };
  }, [items]);

  const selectClass =
    'rounded-full border border-black/10 bg-white px-4 py-2 text-sm text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold';

  return (
    <>
      <PageHeader
        title="Avis & Feedback"
        subtitle="Retours participants"
        actions={
          <select
            aria-label="Filtrer par statut"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'all' | Moderation)}
            className={selectClass}
          >
            <option value="all">Tous</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvés</option>
            <option value="rejected">Rejetés</option>
          </select>
        }
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Note globale" value={stats.global || '—'} hint="avis approuvés" accent="gold" />
        <StatCard label="Avis reçus" value={stats.total} accent="green" />
        <StatCard label="En attente" value={stats.pending} accent="red" />
        <StatCard label="Approuvés" value={stats.approved} accent="blue" />
      </section>

      <section className="mt-6 rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-brand-navy">Tous les avis</h2>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Participant, commentaire…"
            aria-label="Rechercher un avis"
            className="w-64 max-w-full rounded-full border border-black/10 bg-brand-cream px-4 py-2 text-sm text-brand-navy placeholder:text-brand-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
          />
        </div>

        {loading ? (
          <div className="mt-6">
            <LoadingSpinner label="Chargement des avis…" />
          </div>
        ) : error ? (
          <p role="alert" className="mt-4 rounded-md bg-semantic-error/10 p-4 text-sm text-semantic-error">
            {error}
          </p>
        ) : rows.length === 0 ? (
          <EmptyState title="Aucun avis" description="Aucun avis ne correspond aux filtres." />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-brand-muted">
                  <th className="pb-3 font-semibold">Participant</th>
                  <th className="pb-3 font-semibold">Note</th>
                  <th className="pb-3 font-semibold">Commentaire</th>
                  <th className="pb-3 font-semibold">Statut</th>
                  {canModerate && <th className="pb-3 text-right font-semibold">Modération</th>}
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((r) => {
                  const name = r.feedbackLink?.booking?.participant
                    ? `${r.feedbackLink.booking.participant.firstName} ${r.feedbackLink.booking.participant.lastName}`
                    : 'Anonyme';
                  return (
                    <tr
                      key={r.id}
                      className="cursor-pointer border-t border-black/5 align-top hover:bg-brand-cream/50"
                      onClick={() => setSelected(r)}
                    >
                      <td className="max-w-[140px] py-3 pr-2">
                        <span className="block truncate font-semibold text-brand-navy">{name}</span>
                      </td>
                      <td className="py-3 pr-2">
                        <Stars rating={avgRating(r.ratings)} />
                      </td>
                      <td className="max-w-[280px] py-3 pr-2 italic text-brand-muted">
                        <span className="line-clamp-2">{r.comment || '—'}</span>
                      </td>
                      <td className="py-3 pr-2">
                        <Badge tone={STATUS_BADGE[r.moderationStatus].tone} dot>
                          {STATUS_BADGE[r.moderationStatus].label}
                        </Badge>
                      </td>
                      {canModerate && (
                        <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          {r.moderationStatus === 'pending' ? (
                            <div className="flex justify-end gap-1.5">
                              <Button
                                variant="gold"
                                size="sm"
                                disabled={busyId === r.id}
                                onClick={() => setConfirmMod({ id: r.id, action: 'approved' })}
                              >
                                Approuver
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-semantic-error"
                                disabled={busyId === r.id}
                                onClick={() => setConfirmMod({ id: r.id, action: 'rejected' })}
                              >
                                Rejeter
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-brand-muted">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination page={page} pageCount={pageCount} onChange={setPage} />
          </div>
        )}
      </section>

      {/* ── Modal détail avis ── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-brand-navy">
                  {selected.feedbackLink?.booking?.participant
                    ? `${selected.feedbackLink.booking.participant.firstName} ${selected.feedbackLink.booking.participant.lastName}`
                    : 'Anonyme'}
                </p>
                <p className="text-xs text-brand-muted">
                  {new Date(selected.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setSelected(null)}
                className="grid size-7 shrink-0 place-items-center rounded-lg text-brand-muted hover:bg-brand-navy/5"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mb-4 flex items-center gap-3">
              <Stars rating={avgRating(selected.ratings)} />
              <span className="text-sm font-semibold text-brand-navy">{avgRating(selected.ratings)} / 5</span>
              <Badge tone={STATUS_BADGE[selected.moderationStatus].tone} dot>
                {STATUS_BADGE[selected.moderationStatus].label}
              </Badge>
            </div>

            {Object.keys(selected.ratings).length > 0 && (
              <ul className="mb-4 space-y-1.5 rounded-xl bg-brand-cream p-3 text-sm">
                {Object.entries(selected.ratings).map(([key, val]) => (
                  <li key={key} className="flex items-center justify-between">
                    <span className="capitalize text-brand-navy">{key}</span>
                    <span className="text-brand-gold">
                      {'★'.repeat(Math.round(val))}
                      <span className="text-brand-muted/40">{'★'.repeat(Math.max(0, 5 - Math.round(val)))}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {selected.comment ? (
              <p className="text-sm italic text-brand-muted">« {selected.comment} »</p>
            ) : (
              <p className="text-sm text-brand-muted/50">Aucun commentaire.</p>
            )}

            {canModerate && selected.moderationStatus === 'pending' && (
              <div className="mt-5 flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-semantic-error"
                  disabled={busyId === selected.id}
                  onClick={() => { void moderate(selected.id, 'rejected'); setSelected(null); }}
                >
                  Rejeter
                </Button>
                <Button
                  variant="gold"
                  size="sm"
                  disabled={busyId === selected.id}
                  onClick={() => { void moderate(selected.id, 'approved'); setSelected(null); }}
                >
                  Approuver
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmMod !== null}
        title={confirmMod?.action === 'approved' ? 'Approuver cet avis ?' : 'Rejeter cet avis ?'}
        description={
          confirmMod?.action === 'approved'
            ? "L'avis sera publié sur le site public (témoignages)."
            : "L'avis ne sera pas publié. Cette action peut être réajustée plus tard."
        }
        confirmLabel={confirmMod?.action === 'approved' ? 'Approuver' : 'Rejeter'}
        onCancel={() => setConfirmMod(null)}
        onConfirm={() => {
          const target = confirmMod;
          setConfirmMod(null);
          if (target) void moderate(target.id, target.action);
        }}
      />
    </>
  );
}
