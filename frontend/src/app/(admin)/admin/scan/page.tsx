'use client';

/**
 * Admin — Scan & Contrôle d'accès. Branché backend.
 *  - Vérifier : POST /api/scan/verify   body { ticketId, signature }
 *  - Confirmer: POST /api/scan/confirm  body { ticketId }
 *
 * La vérification HMAC + l'anti-rejeu sont 100 % côté backend. Faute de librairie
 * caméra installée, l'opérateur colle le contenu du QR (JSON { ticketId, signature }).
 */
import { Camera } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/admin/Badge';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Button } from '@/components/ui/button';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { ROUTES } from '@/constants/routes';
import { ApiError, apiAuth } from '@/lib/api';

interface VerifiedTicket {
  id: string;
  ticketNumber: string;
  booking: {
    event: { title: string } | null;
    participant: { firstName: string; lastName: string } | null;
  } | null;
}

interface VerifyResult {
  valid: boolean;
  ticket?: VerifiedTicket;
  error?: string;
}

interface ScanLog {
  label: string;
  detail: string;
  ok: boolean;
  time: string;
}

const ERROR_LABEL: Record<string, string> = {
  invalid: 'Signature invalide',
  not_found: 'Billet introuvable',
  already_scanned: 'Billet déjà scanné',
};

function nowLabel(): string {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date());
}

export default function AdminScanPage() {
  return (
    <PermissionGuard permission="scan">
      <ScanContent />
    </PermissionGuard>
  );
}

function ScanContent() {
  const router = useRouter();
  const [payload, setPayload] = useState('');
  const [pending, setPending] = useState<VerifiedTicket | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [recent, setRecent] = useState<ScanLog[]>([]);
  const [validated, setValidated] = useState(0);
  const [refused, setRefused] = useState(0);

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

  const pushLog = (entry: Omit<ScanLog, 'time'>) =>
    setRecent((list) => [{ ...entry, time: nowLabel() }, ...list].slice(0, 8));

  const verify = async () => {
    setMessage(null);
    setPending(null);
    let parsed: { ticketId: string; signature: string };
    try {
      const obj = JSON.parse(payload) as { ticketId?: unknown; signature?: unknown };
      if (typeof obj.ticketId !== 'string' || typeof obj.signature !== 'string') {
        throw new Error('format');
      }
      parsed = { ticketId: obj.ticketId, signature: obj.signature };
    } catch {
      setMessage('Contenu du QR invalide (JSON { ticketId, signature } attendu).');
      return;
    }

    try {
      setBusy(true);
      const res = await apiAuth<{ data: VerifyResult }>('/scan/verify', {
        method: 'POST',
        body: JSON.stringify(parsed),
      });
      if (res.data.valid && res.data.ticket) {
        setPending(res.data.ticket);
      } else {
        const reason = ERROR_LABEL[res.data.error ?? ''] ?? 'Billet refusé';
        setRefused((n) => n + 1);
        pushLog({ label: 'Refusé', detail: reason, ok: false });
        setMessage(reason);
      }
    } catch (err) {
      if (!handleAuthError(err)) setMessage('La vérification a échoué.');
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!pending) return;
    try {
      setBusy(true);
      await apiAuth('/scan/confirm', {
        method: 'POST',
        body: JSON.stringify({ ticketId: pending.id }),
      });
      const name = pending.booking?.participant
        ? `${pending.booking.participant.firstName} ${pending.booking.participant.lastName}`
        : pending.ticketNumber;
      setValidated((n) => n + 1);
      pushLog({ label: name, detail: `${pending.ticketNumber} · entrée validée`, ok: true });
      setPending(null);
      setPayload('');
      setMessage('Entrée validée, certificat envoyé.');
    } catch (err) {
      if (!handleAuthError(err)) setMessage("La confirmation a échoué (billet déjà scanné ?).");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Scan & Contrôle d'accès"
        subtitle="Vérification des billets — Jour J"
        actions={
          <Badge tone="success" dot>
            Backend prêt
          </Badge>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Entrées validées" value={validated} accent="green" />
        <StatCard label="Accès refusés" value={refused} accent="red" />
        <StatCard label="Cette session" value={validated + refused} accent="blue" />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Interface de scan */}
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-brand-navy">Interface de scan</h2>
          <div className="mt-4 grid aspect-video place-items-center rounded-xl border-2 border-dashed border-brand-gold/40 bg-brand-cream/50 text-center">
            <div>
              <Camera className="mx-auto size-8 text-brand-gold" />
              <p className="mt-3 text-sm text-brand-muted">Collez le contenu du QR ci-dessous</p>
            </div>
          </div>

          <label htmlFor="qr-payload" className="mt-4 block text-sm font-semibold text-brand-navy">
            Contenu du QR (JSON)
          </label>
          <textarea
            id="qr-payload"
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            rows={3}
            placeholder='{"ticketId":"…","signature":"…"}'
            className="mt-1 w-full rounded-lg border border-black/10 bg-brand-cream px-3 py-2 font-mono text-xs text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
          />

          {message && <p className="mt-3 text-sm text-brand-navy">{message}</p>}

          {pending ? (
            <div className="mt-4 rounded-xl border border-semantic-success/30 bg-semantic-success/5 p-4">
              <p className="font-semibold text-brand-navy">
                {pending.booking?.participant
                  ? `${pending.booking.participant.firstName} ${pending.booking.participant.lastName}`
                  : '—'}
              </p>
              <p className="text-xs text-brand-muted">
                {pending.ticketNumber} · {pending.booking?.event?.title ?? ''}
              </p>
              <div className="mt-3 flex gap-3">
                <Button variant="gold" className="flex-1" disabled={busy} onClick={confirm}>
                  Confirmer l&apos;entrée
                </Button>
                <Button variant="outline" disabled={busy} onClick={() => setPending(null)}>
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="gold" className="mt-4 w-full" disabled={busy || !payload.trim()} onClick={verify}>
              Vérifier le billet
            </Button>
          )}
        </div>

        {/* Scans récents */}
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-brand-navy">Scans récents</h2>
            <Badge tone="success" dot>
              Session
            </Badge>
          </div>
          {recent.length === 0 ? (
            <p className="mt-4 text-sm text-brand-muted">Aucun scan pour le moment.</p>
          ) : (
            <ul className="mt-4 divide-y divide-black/5">
              {recent.map((s, i) => (
                <li key={i} className="flex items-center gap-3 py-3">
                  <span
                    className={`size-9 shrink-0 rounded-full ${
                      s.ok ? 'bg-semantic-success/15' : 'bg-semantic-error/15'
                    }`}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-brand-navy">{s.label}</p>
                    <p className={`truncate text-xs ${s.ok ? 'text-brand-muted' : 'text-semantic-error'}`}>
                      {s.detail}
                    </p>
                  </div>
                  <span className="text-xs text-brand-muted">{s.time}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
