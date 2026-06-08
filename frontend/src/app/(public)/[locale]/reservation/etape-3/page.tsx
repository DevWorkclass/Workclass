'use client';

/**
 * Réservation — Étape 3/3 : paiement (mobile money) + confirmation.
 * Affiche le récapitulatif, les numéros mobile money configurés (GET /content/payment-config),
 * puis crée la réservation (POST /bookings). Paiement = simulation : la réservation est
 * créée « en attente », le participant règle vers le numéro indiqué et conserve sa référence.
 */
import { ArrowLeft, Smartphone } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/formatters';
import { apiFetch, ApiError } from '@/lib/api';
import { getDraft, clearDraft, type ReservationDraft } from '@/lib/reservation-draft';

interface PaymentConfig {
  airtelMoney: string;
  mobileCash: string;
  instructions: string;
}

const STEPS = ['Type de billet', 'Vos informations', 'Paiement'] as const;

export default function ReservationEtape3Page() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'fr';

  const [draft, setDraft] = useState<ReservationDraft | null>(null);
  const [payment, setPayment] = useState<PaymentConfig | null>(null);
  const [method, setMethod] = useState<'airtel' | 'mobilecash'>('airtel');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const d = getDraft();
    if (!d || !d.participant) {
      router.replace(`/${locale}/reservation/etape-${d ? '2' : '1'}`);
      return;
    }
    setDraft(d);
    apiFetch<{ data: PaymentConfig }>('/content/payment-config')
      .then((res) => setPayment(res.data))
      .catch(() => {});
  }, [locale, router]);

  const confirm = async () => {
    if (!draft?.participant) return;
    try {
      setSubmitting(true);
      setError(null);
      const res = await apiFetch<{ data: { reference: string } }>('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          eventId: draft.eventId,
          ticketTypeId: draft.ticketTypeId,
          quantity: draft.quantity,
          participant: draft.participant,
        }),
      });
      clearDraft();
      router.push(`/${locale}/reservation/confirmation?ref=${encodeURIComponent(res.data.reference)}`);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 400
          ? 'Réservation impossible (quota épuisé ou données invalides).'
          : 'La réservation a échoué. Réessayez.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!draft) return null;
  const total = draft.unitPrice * draft.quantity;
  const selectedNumber = method === 'airtel' ? payment?.airtelMoney : payment?.mobileCash;

  const methodBtn = (key: 'airtel' | 'mobilecash', label: string, number?: string) => (
    <button
      type="button"
      onClick={() => setMethod(key)}
      {...{ 'aria-pressed': method === key }}
      className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-colors ${
        method === key ? 'border-brand-gold bg-brand-gold/10' : 'border-black/10 hover:border-brand-gold/50'
      }`}
    >
      <Smartphone className="size-5 text-brand-gold" />
      <div>
        <p className="font-semibold text-brand-navy">{label}</p>
        <p className="text-xs text-brand-muted">{number || 'Non configuré'}</p>
      </div>
    </button>
  );

  return (
    <main className="bg-brand-cream py-10 lg:py-14">
      <div className="container">
        <header className="mb-8">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/reservation/etape-2`)}
            className="mb-5 flex w-fit items-center gap-1.5 text-sm font-medium text-brand-navy/60 transition-colors hover:text-brand-navy"
          >
            <ArrowLeft className="size-4" />
            Retour
          </button>
          <h1 className="text-3xl font-extrabold text-brand-navy lg:text-4xl">Paiement</h1>
        </header>

        <ol className="mb-8 grid grid-cols-1 gap-2 rounded-full bg-white p-2 shadow-sm sm:grid-cols-3">
          {STEPS.map((label, index) => (
            <li
              key={label}
              aria-current={index === 2 ? 'step' : undefined}
              className={`flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold ${
                index === 2 ? 'bg-brand-navy text-white' : 'text-brand-muted'
              }`}
            >
              {index + 1} · {label}
            </li>
          ))}
        </ol>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="space-y-5 rounded-2xl border border-black/5 bg-white p-6 shadow-sm lg:p-8">
            <h2 className="text-xl font-bold text-brand-navy">Mode de paiement</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {methodBtn('airtel', 'Airtel Money', payment?.airtelMoney)}
              {methodBtn('mobilecash', 'Mobile Cash', payment?.mobileCash)}
            </div>

            <div className="rounded-xl bg-brand-cream p-4 text-sm text-brand-navy">
              {selectedNumber ? (
                <>
                  <p>
                    Envoyez <span className="font-bold">{formatPrice(total, draft.currency)}</span> au numéro{' '}
                    <span className="font-bold text-brand-gold">{selectedNumber}</span>.
                  </p>
                  {payment?.instructions && (
                    <p className="mt-2 text-brand-muted">{payment.instructions}</p>
                  )}
                </>
              ) : (
                <p className="text-brand-muted">
                  Numéro de paiement non configuré. Votre réservation sera enregistrée « en attente » ;
                  l&apos;équipe vous contactera pour le règlement.
                </p>
              )}
            </div>

            {error && (
              <p role="alert" className="rounded-md bg-semantic-error/10 p-3 text-sm text-semantic-error">
                {error}
              </p>
            )}

            <Button variant="gold" size="lg" className="w-full" disabled={submitting} onClick={confirm}>
              {submitting ? 'Validation…' : 'Confirmer ma réservation'}
            </Button>
            <p className="text-center text-xs text-brand-muted">
              Votre billet et certificat vous seront envoyés après validation du paiement.
            </p>
          </section>

          <aside className="h-fit rounded-2xl bg-[linear-gradient(160deg,#0E2450_5%,#2152B6_95%)] p-5 text-white shadow-lg">
            <h2 className="text-lg font-bold">{draft.eventTitle}</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-white/60">Billet</dt>
                <dd className="font-semibold">{draft.ticketName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/60">Participant</dt>
                <dd className="text-right font-semibold">
                  {draft.participant?.firstName} {draft.participant?.lastName}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/60">Quantité</dt>
                <dd className="font-semibold">{draft.quantity}</dd>
              </div>
            </dl>
            <div className="mt-5 flex items-baseline justify-between border-t border-white/15 pt-4">
              <span className="text-lg font-bold">Total</span>
              <span className="text-2xl font-extrabold">{formatPrice(total, draft.currency)}</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
