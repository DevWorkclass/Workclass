'use client';

/**
 * Admin — Certificats. Branché backend.
 *  - Liste : GET /api/admin/tickets (billets + état certificat + présence scannée)
 * Le certificat est généré/envoyé automatiquement à la confirmation du scan.
 * Cette page est en lecture seule (suivi des statuts + liens de téléchargement).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/admin/Badge';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Button } from '@/components/ui/button';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ROUTES } from '@/constants/routes';
import { ApiError, apiAuth } from '@/lib/api';

interface AdminTicket {
  id: string;
  ticketNumber: string;
  scannedAt: string | null;
  certificateSent: boolean;
  certificateUrl: string | null;
  booking: {
    event: { title: string } | null;
    participant: { firstName: string; lastName: string } | null;
  } | null;
}

export default function AdminCertificatesPage() {
  return (
    <PermissionGuard permission="tickets:generate">
      <CertificatesContent />
    </PermissionGuard>
  );
}

function CertificatesContent() {
  const router = useRouter();
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    apiAuth<{ data: AdminTicket[] }>('/admin/tickets?limit=200')
      .then((res) => active && setTickets(res.data))
      .catch((err) => {
        if (active && !handleAuthError(err)) setError('Impossible de charger les certificats.');
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [handleAuthError]);

  const stats = useMemo(
    () => ({
      generated: tickets.filter((t) => t.certificateUrl).length,
      sent: tickets.filter((t) => t.certificateSent).length,
      present: tickets.filter((t) => t.scannedAt).length,
    }),
    [tickets],
  );

  return (
    <>
      <PageHeader title="Certificats" subtitle="Suivi post-événement (génération automatique au scan)" />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Certificats générés" value={stats.generated} accent="gold" />
        <StatCard label="Envoyés" value={stats.sent} accent="green" />
        <StatCard label="Présents (scannés)" value={stats.present} accent="blue" />
      </section>

      <section className="mt-6 rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="font-bold text-brand-navy">Participants — Statut certificats</h2>

        {loading ? (
          <div className="mt-6">
            <LoadingSpinner label="Chargement des certificats…" />
          </div>
        ) : error ? (
          <p role="alert" className="mt-4 rounded-md bg-semantic-error/10 p-4 text-sm text-semantic-error">
            {error}
          </p>
        ) : tickets.length === 0 ? (
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
                {tickets.map((t) => {
                  const name = t.booking?.participant
                    ? `${t.booking.participant.firstName} ${t.booking.participant.lastName}`
                    : '—';
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
                        {t.certificateUrl ? (
                          <a href={t.certificateUrl} target="_blank" rel="noreferrer">
                            <Button variant="outline" size="sm">
                              Télécharger
                            </Button>
                          </a>
                        ) : (
                          <span className="text-xs text-brand-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
