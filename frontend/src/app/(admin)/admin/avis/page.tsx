'use client';

/**
 * Admin — Avis & Feedback. Branché backend.
 *  - Liste    : GET  /api/admin/feedback?status=
 *  - Modérer  : POST /api/admin/feedback/moderate  body { responseId, action }
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                    <tr key={r.id} className="border-t border-black/5 align-top">
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
                        <td className="py-3 text-right">
                          {r.moderationStatus === 'pending' ? (
                            <div className="flex justify-end gap-1.5">
                              <Button
                                variant="gold"
                                size="sm"
                                disabled={busyId === r.id}
                                onClick={() => moderate(r.id, 'approved')}
                              >
                                Approuver
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-semantic-error"
                                disabled={busyId === r.id}
                                onClick={() => moderate(r.id, 'rejected')}
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
    </>
  );
}
