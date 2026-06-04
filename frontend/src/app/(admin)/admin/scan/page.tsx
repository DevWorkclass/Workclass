'use client';

/**
 * Admin — Scan & Contrôle d'accès. Interface de scan (simulation) + flux live.
 * Le vrai contrôle (vérif HMAC, anti-rejeu) est assuré côté backend.
 */
import { Camera } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/admin/Badge';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Button } from '@/components/ui/button';
import { ADMIN_SCAN_RECENT, type AdminScanEntry } from '@/data/adminMockData';

const POOL: AdminScanEntry[] = [
  { participant: 'Carole Bekale', reference: 'WCG-2026-00152', ticket: 'Standard', time: '', status: 'valid' },
  { participant: 'Georges Ella', reference: 'WCG-2026-00153', ticket: 'VIP Premium', time: '', status: 'valid' },
  { participant: 'Inconnu', reference: '—', time: '', status: 'invalid', reason: 'Billet invalide ou déjà utilisé' },
];

function nowLabel(): string {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date());
}

export default function AdminScanPage() {
  const [recent, setRecent] = useState<AdminScanEntry[]>(ADMIN_SCAN_RECENT);
  const [validated, setValidated] = useState(0);
  const [refused, setRefused] = useState(0);
  const [cursor, setCursor] = useState(0);

  function simulateScan() {
    const base = POOL[cursor % POOL.length] as AdminScanEntry;
    const entry: AdminScanEntry = { ...base, time: nowLabel() };
    setCursor((c) => c + 1);
    setRecent((list) => [entry, ...list].slice(0, 8));
    if (entry.status === 'valid') setValidated((n) => n + 1);
    else setRefused((n) => n + 1);
  }

  return (
    <>
      <PageHeader
        title="Scan & Contrôle d'accès"
        subtitle="Interface de scan en direct — Jour J"
        actions={
          <>
            <Badge tone="success" dot>
              Caméra prête
            </Badge>
            <Button variant="outline" size="sm">
              Stats du jour
            </Button>
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Entrées validées" value={validated} accent="green" />
        <StatCard label="Accès refusés" value={refused} accent="red" />
        <StatCard label="Billets générés" value={227} accent="blue" />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Interface de scan */}
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-brand-navy">Interface de scan</h2>
          <div className="mt-4 grid aspect-square place-items-center rounded-xl border-2 border-dashed border-brand-gold/40 bg-brand-cream/50 text-center">
            <div>
              <Camera className="mx-auto size-8 text-brand-gold" />
              <p className="mt-3 text-sm text-brand-muted">En attente d&apos;un QR Code</p>
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-brand-muted">
            Pointez le QR Code vers la caméra
          </p>
          <div className="mt-4 flex gap-3">
            <Button variant="gold" className="flex-1" onClick={simulateScan}>
              ▶ Simuler un scan
            </Button>
            <Button variant="outline">Code manuel</Button>
          </div>
        </div>

        {/* Scans récents */}
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-brand-navy">Scans récents</h2>
            <Badge tone="success" dot>
              Live
            </Badge>
          </div>
          <ul className="mt-4 divide-y divide-black/5">
            {recent.map((s, i) => (
              <li key={`${s.reference}-${i}`} className="flex items-center gap-3 py-3">
                <span
                  className={`size-9 shrink-0 rounded-full ${
                    s.status === 'valid' ? 'bg-semantic-success/15' : 'bg-semantic-error/15'
                  }`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-brand-navy">{s.participant}</p>
                  {s.status === 'valid' ? (
                    <p className="truncate text-xs text-brand-muted">
                      {s.reference} · {s.ticket}
                    </p>
                  ) : (
                    <p className="truncate text-xs text-semantic-error">{s.reason}</p>
                  )}
                </div>
                <span className="text-xs text-brand-muted">{s.time}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
