'use client';

/**
 * Réservation — Confirmation finale.
 * Lit la référence depuis query `ref`.
 * Si un URL WhatsApp est stocké en sessionStorage (wcg-wa-pending), ouvre WhatsApp
 * automatiquement via un <a> DOM click (jamais bloqué par les popup blockers).
 */
import { CheckCircle2, MessageCircle, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';

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

  const [waUrl, setWaUrl] = useState<string | null>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('wcg-wa-pending');
    if (stored) {
      sessionStorage.removeItem('wcg-wa-pending');
      setWaUrl(stored);
      // Auto-click le lien WhatsApp dès que le DOM est prêt
      // (clic synchrone sur un <a> = jamais bloqué par les navigateurs)
      requestAnimationFrame(() => {
        linkRef.current?.click();
      });
    }
  }, []);

  const NEXT_STEPS = [
    {
      icon: MessageCircle,
      title: 'Message WhatsApp envoyé',
      desc: "L'équipe a reçu votre notification de paiement.",
    },
    {
      icon: Clock,
      title: 'Vérification du paiement',
      desc: "L'admin vérifie le montant reçu sur son application Airtel/Moov.",
    },
    {
      icon: CheckCircle2,
      title: 'Tickets envoyés par email',
      desc: 'Dès validation, chaque participant reçoit son billet électronique.',
    },
  ];

  return (
    <main className="bg-brand-cream py-16">
      <div className="container max-w-xl">
        <div className="rounded-2xl bg-[linear-gradient(160deg,#0E2450_5%,#2152B6_95%)] p-8 shadow-xl">
          {/* Lien WhatsApp caché — auto-cliqué par le useEffect, invisible pour l'utilisateur */}
          {waUrl && (
            <a
              ref={linkRef}
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-hidden
              tabIndex={-1}
              className="sr-only"
            >
              WhatsApp
            </a>
          )}

          {/* Icône succès */}
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-white/10">
            <CheckCircle2 className="size-11 text-brand-gold" />
          </div>

          <h1 className="mt-6 text-center text-2xl font-extrabold text-white">
            Réservation enregistrée !
          </h1>
          <p className="mt-2 text-center text-sm text-white/70">
            Votre demande est en cours de vérification. Conservez votre référence.
          </p>

          {/* Référence */}
          {reference && (
            <div className="mt-6 rounded-xl bg-white/10 p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
                Référence de réservation
              </p>
              <p className="mt-2 font-mono text-2xl font-bold text-brand-gold">{reference}</p>
              <p className="mt-1 text-xs text-white/50">
                Communiquez cette référence à l&apos;équipe si besoin.
              </p>
            </div>
          )}

          {/* CTA WhatsApp visible (si WhatsApp configuré) */}
          {waUrl && (
            <div className="mt-6 rounded-xl border border-white/10 bg-white/10 p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-400/20">
                  <MessageCircle className="size-5 text-green-300" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">Message WhatsApp en cours d&apos;ouverture…</p>
                  <p className="mt-0.5 text-sm text-white/60">
                    Si WhatsApp ne s&apos;est pas ouvert automatiquement, cliquez ci-dessous.
                  </p>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-400"
                  >
                    <MessageCircle className="size-4" />
                    Ouvrir WhatsApp
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Séparateur */}
          <div className="mt-8 border-t border-white/10" />

          {/* Étapes suivantes */}
          <div className="mt-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/50">
              Prochaines étapes
            </p>
            <ol className="space-y-4">
              {NEXT_STEPS.map(({ icon: Icon, title, desc }, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-gold/20">
                    <Icon className="size-4 text-brand-gold" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{title}</p>
                    <p className="text-sm text-white/60">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-center">
            <Button asChild variant="gold">
              <Link href={`/${locale}`}>Retour à l&apos;accueil</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
