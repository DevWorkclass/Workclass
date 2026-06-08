'use client';

/**
 * Admin — Événements. Branché backend.
 *  - Liste : GET /api/events (tous les événements, tri par date de création)
 */
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Badge, type BadgeTone } from '@/components/admin/Badge';
import { PageHeader } from '@/components/admin/PageHeader';
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

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const remove = async (ev: AdminEvent) => {
    if (!window.confirm(`Supprimer définitivement « ${ev.title} » ?`)) return;
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
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h2 className="truncate text-lg font-bold text-brand-navy">{ev.title}</h2>
                <p className="mt-1 text-sm text-brand-muted">{formatRange(ev.startDate, ev.endDate)}</p>
                <p className="truncate text-sm text-brand-muted">{ev.location}</p>

                {/* Places disponibles (mis à jour après chaque réservation) */}
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

                <div className="mt-auto flex flex-wrap gap-2 pt-4">
                  <Link href={`${ROUTES.admin.events}/${ev.id}/modifier`}>
                    <Button variant="outline" size="sm">
                      Modifier
                    </Button>
                  </Link>
                  <Link href={ROUTES.public.eventDetail(ev.slug)} target="_blank">
                    <Button variant="outline" size="sm">
                      Voir la page
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-semantic-error"
                    disabled={busyId === ev.id}
                    onClick={() => remove(ev)}
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
    </>
  );
}
