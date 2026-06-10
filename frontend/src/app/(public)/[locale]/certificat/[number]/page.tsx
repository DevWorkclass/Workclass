'use client';

/**
 * Page publique — authentification d'un certificat (ouverte via le QR du document).
 *  - GET /api/public/certificate/:number
 * Affiche un statut « authentique » (avec détails) ou « non reconnu ».
 */
import { use, useEffect, useState } from 'react';
import { BadgeCheck, ShieldAlert } from 'lucide-react';

import { Logo } from '@/components/shared/Logo';
import { apiFetch } from '@/lib/api';

interface VerifyResult {
  valid: boolean;
  certificateNumber?: string;
  participantName?: string;
  eventTitle?: string;
  eventDate?: string;
}

export default function CertificateVerifyPage({
  params,
}: Readonly<{ params: Promise<{ number: string }> }>) {
  const { number } = use(params);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ data: VerifyResult }>(`/public/certificate/${encodeURIComponent(number)}`)
      .then((res) => setResult(res.data))
      .catch(() => setResult({ valid: false }))
      .finally(() => setLoading(false));
  }, [number]);

  return (
    <main className="grid min-h-[70vh] place-items-center bg-brand-cream px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        {loading ? (
          <p className="text-brand-muted">Vérification du certificat…</p>
        ) : result?.valid ? (
          <>
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-semantic-success/10">
              <BadgeCheck className="size-9 text-semantic-success" />
            </div>
            <h1 className="mt-4 text-xl font-extrabold text-brand-navy">Certificat authentique</h1>
            <p className="mt-1 text-sm text-brand-muted">
              Ce document est officiellement délivré par Work Class Gabon.
            </p>

            <dl className="mt-6 space-y-2 text-left text-sm">
              <div className="flex justify-between gap-4 border-b border-black/5 pb-2">
                <dt className="text-brand-muted">Titulaire</dt>
                <dd className="font-semibold text-brand-navy">{result.participantName}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-black/5 pb-2">
                <dt className="text-brand-muted">Événement</dt>
                <dd className="text-right font-semibold text-brand-navy">{result.eventTitle}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-black/5 pb-2">
                <dt className="text-brand-muted">Délivré le</dt>
                <dd className="font-semibold text-brand-navy">{result.eventDate}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-brand-muted">N° certificat</dt>
                <dd className="font-mono text-xs font-semibold text-brand-navy">
                  {result.certificateNumber}
                </dd>
              </div>
            </dl>
          </>
        ) : (
          <>
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-semantic-error/10">
              <ShieldAlert className="size-9 text-semantic-error" />
            </div>
            <h1 className="mt-4 text-xl font-extrabold text-brand-navy">Certificat non reconnu</h1>
            <p className="mt-1 text-sm text-brand-muted">
              Aucun certificat valide ne correspond à ce numéro. Méfiez-vous d&apos;un document
              falsifié.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
