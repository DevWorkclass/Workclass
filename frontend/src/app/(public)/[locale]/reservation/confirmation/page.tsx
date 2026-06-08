'use client';

/**
 * Réservation — Confirmation finale. Affiche la référence (query `ref`).
 */
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';

export default function ReservationConfirmationPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmationContent />
    </Suspense>
  );
}

function ConfirmationContent() {
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'fr';
  const reference = useSearchParams().get('ref');

  return (
    <main className="bg-brand-cream py-16">
      <div className="container max-w-lg">
        <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-semantic-success/10">
            <CheckCircle2 className="size-9 text-semantic-success" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold text-brand-navy">Réservation enregistrée !</h1>
          <p className="mt-2 text-sm text-brand-muted">
            Votre demande est en attente de validation du paiement. Conservez votre référence.
          </p>

          {reference && (
            <div className="mt-6 rounded-xl bg-brand-cream p-4">
              <p className="text-xs uppercase tracking-wider text-brand-muted">Référence</p>
              <p className="mt-1 font-mono text-xl font-bold text-brand-navy">{reference}</p>
            </div>
          )}

          <p className="mt-6 text-sm text-brand-muted">
            Votre billet électronique et votre certificat vous seront envoyés par email après
            confirmation du paiement.
          </p>

          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild variant="gold">
              <Link href={`/${locale}`}>Retour à l&apos;accueil</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${locale}/participant`}>Mon billet</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
