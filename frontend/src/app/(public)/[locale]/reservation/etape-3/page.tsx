'use client';

/**
 * Réservation — Étape 3/3 : récapitulatif + paiement + confirmation WhatsApp.
 * 1. Affiche le résumé complet (événement, participants, montant, numéros mobile money).
 * 2. "J'ai effectué le paiement" → POST /bookings → réservation créée (pending).
 * 3. Ouvre WhatsApp avec un message pré-rempli pour notifier l'admin.
 * 4. Redirige vers la page de confirmation avec la référence.
 */
import { ArrowLeft, CheckCircle2, MessageCircle, Smartphone, Users } from 'lucide-react';
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

interface SupportConfig {
  whatsapp: string;
  email: string;
}

const STEPS = ['Sélection', 'Informations', 'Paiement'] as const;

export default function ReservationEtape3Page() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'fr';

  const [draft, setDraft] = useState<ReservationDraft | null>(null);
  const [payment, setPayment] = useState<PaymentConfig | null>(null);
  const [support, setSupport] = useState<SupportConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const d = getDraft();
    if (!d || !d.participants?.length || !d.payerPhone) {
      router.replace(`/${locale}/reservation/etape-${d ? '2' : '1'}`);
      return;
    }
    setDraft(d);

    Promise.all([
      apiFetch<{ data: PaymentConfig }>('/content/payment-config').catch(() => null),
      apiFetch<{ data: SupportConfig }>('/content/support').catch(() => null),
    ])
      .then(([payRes, supRes]) => {
        if (payRes) setPayment(payRes.data);
        if (supRes) setSupport(supRes.data);
      })
      .finally(() => setConfigLoading(false));
  }, [locale, router]);

  const buildWhatsAppMessage = (ref: string, d: ReservationDraft): string => {
    const total = d.unitPrice * d.quantity;
    const participantsList =
      d.participants
        ?.map((p) => `• ${p.firstName} ${p.lastName}`)
        .join('\n') ?? '';

    return (
      `Bonjour,\n\n` +
      `Je viens de réserver *${d.quantity} place${d.quantity > 1 ? 's' : ''}* pour :\n\n` +
      `→ Événement : ${d.eventTitle}\n` +
      `→ Référence : ${ref}\n` +
      `→ Montant à payer : ${total.toLocaleString('fr-FR')} XAF\n` +
      `→ Numéro du payeur : ${d.payerPhone ?? ''}\n\n` +
      `Participants :\n${participantsList}\n\n` +
      `Merci de vérifier mon paiement et de valider ma réservation.\n` +
      `Je recevrai les tickets par email une fois validé.\n\n` +
      `Cordialement`
    );
  };

  const handleConfirm = async () => {
    if (!draft?.participants || !draft.payerPhone) return;
    try {
      setSubmitting(true);
      setError(null);

      const res = await apiFetch<{ data: { reference: string } }>('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          eventId: draft.eventId,
          ticketTypeId: draft.ticketTypeId,
          quantity: draft.quantity,
          payerPhone: draft.payerPhone,
          payerName: draft.payerName,
          participants: draft.participants,
        }),
      });

      const reference = res.data.reference;
      clearDraft();

      // Stocke l'URL WhatsApp pour la page de confirmation (window.open après await
      // est bloqué par les navigateurs — on passe par un lien cliquable côté confirmation).
      if (support?.whatsapp) {
        const rawNumber = support.whatsapp.replace(/\D/g, '');
        const message = buildWhatsAppMessage(reference, draft);
        const waUrl = `https://wa.me/${rawNumber}?text=${encodeURIComponent(message)}`;
        sessionStorage.setItem('wcg-wa-pending', waUrl);
      }

      router.push(`/${locale}/reservation/confirmation?ref=${encodeURIComponent(reference)}`);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 400
          ? 'Réservation impossible (quota épuisé ou données invalides).'
          : 'La réservation a échoué. Veuillez réessayer.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!draft) return null;
  const total = draft.unitPrice * draft.quantity;

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
          <h1 className="text-3xl font-extrabold text-brand-navy lg:text-4xl">
            Récapitulatif &amp; Paiement
          </h1>
        </header>

        {/* Stepper */}
        <ol className="mb-8 grid grid-cols-3 gap-2 rounded-full bg-white p-2 shadow-sm">
          {STEPS.map((label, index) => (
            <li
              key={label}
              aria-current={index === 2 ? 'step' : undefined}
              className={`flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition-colors ${
                index === 2
                  ? 'bg-brand-navy text-white'
                  : 'text-brand-gold'
              }`}
            >
              {index < 2 && <CheckCircle2 className="mr-1.5 size-3.5" />}
              {index + 1} · {label}
            </li>
          ))}
        </ol>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            {/* Récapitulatif de commande */}
            <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm lg:p-8">
              <h2 className="text-xl font-bold text-brand-navy">Votre commande</h2>

              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4 rounded-lg bg-brand-cream px-4 py-3">
                  <dt className="font-semibold text-brand-navy">Événement</dt>
                  <dd className="text-right font-bold text-brand-navy">{draft.eventTitle}</dd>
                </div>
                <div className="flex justify-between gap-4 px-4">
                  <dt className="text-brand-muted">Billet</dt>
                  <dd className="font-semibold text-brand-navy">{draft.ticketName}</dd>
                </div>
                <div className="flex justify-between gap-4 px-4">
                  <dt className="text-brand-muted">Nombre de places</dt>
                  <dd className="font-semibold text-brand-navy">{draft.quantity}</dd>
                </div>
                <div className="flex justify-between gap-4 px-4">
                  <dt className="text-brand-muted">Numéro du payeur</dt>
                  <dd className="font-semibold text-brand-navy">{draft.payerPhone}</dd>
                </div>
                {draft.payerName && (
                  <div className="flex justify-between gap-4 px-4">
                    <dt className="text-brand-muted">Nom du payeur</dt>
                    <dd className="font-semibold text-brand-navy">{draft.payerName}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4 border-t border-black/5 px-4 pt-3">
                  <dt className="text-lg font-bold text-brand-navy">Montant total</dt>
                  <dd className="text-2xl font-extrabold text-brand-gold">
                    {formatPrice(total, draft.currency)}
                  </dd>
                </div>
              </dl>
            </section>

            {/* Participants */}
            {draft.participants && draft.participants.length > 0 && (
              <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm lg:p-8">
                <div className="mb-4 flex items-center gap-2">
                  <Users className="size-5 text-brand-gold" />
                  <h2 className="text-xl font-bold text-brand-navy">Participants</h2>
                </div>
                <ul className="space-y-2">
                  {draft.participants.map((p, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-4 rounded-lg bg-brand-cream px-4 py-2.5 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex size-5 items-center justify-center rounded-full bg-brand-navy text-xs font-bold text-white">
                          {i + 1}
                        </span>
                        <span className="font-semibold text-brand-navy">
                          {p.firstName} {p.lastName}
                        </span>
                      </div>
                      {p.email && (
                        <span className="text-brand-muted">{p.email}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Instructions de paiement */}
            <section className="rounded-2xl border border-brand-gold/30 bg-white p-6 shadow-sm lg:p-8">
              <div className="mb-4 flex items-center gap-2">
                <Smartphone className="size-5 text-brand-gold" />
                <h2 className="text-xl font-bold text-brand-navy">Instructions de paiement</h2>
              </div>

              {configLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="bg-black/6 h-4 w-3/4 rounded-lg" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="bg-black/6 h-16 rounded-xl" />
                    <div className="bg-black/6 h-16 rounded-xl" />
                  </div>
                  <div className="bg-black/6 h-10 rounded-lg" />
                </div>
              ) : (
                <>
                  <p className="text-sm text-brand-navy">
                    Veuillez effectuer le paiement du montant total via{' '}
                    <strong>Airtel Money</strong> ou <strong>Moov Money</strong> :
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {payment?.airtelMoney ? (
                      <div className="flex items-center gap-3 rounded-xl border border-black/10 p-4">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-100">
                          <Smartphone className="size-4 text-red-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                            Airtel Money
                          </p>
                          <p className="text-lg font-bold text-brand-navy">{payment.airtelMoney}</p>
                        </div>
                      </div>
                    ) : null}
                    {payment?.mobileCash ? (
                      <div className="flex items-center gap-3 rounded-xl border border-black/10 p-4">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-100">
                          <Smartphone className="size-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                            Moov Money
                          </p>
                          <p className="text-lg font-bold text-brand-navy">{payment.mobileCash}</p>
                        </div>
                      </div>
                    ) : null}
                    {!payment?.airtelMoney && !payment?.mobileCash && (
                      <p className="col-span-2 text-sm italic text-brand-muted">
                        Numéros de paiement non encore configurés — l&apos;équipe vous contactera pour
                        finaliser le règlement.
                      </p>
                    )}
                  </div>

                  {payment?.instructions && (
                    <p className="mt-4 rounded-lg bg-brand-cream p-3 text-sm text-brand-muted">
                      {payment.instructions}
                    </p>
                  )}

                  <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                    Envoyez exactement{' '}
                    <strong>{formatPrice(total, draft.currency)}</strong> depuis le numéro{' '}
                    <strong>{draft.payerPhone}</strong>.
                  </div>
                </>
              )}
            </section>

            {/* Erreur */}
            {error && (
              <p
                role="alert"
                className="rounded-md bg-semantic-error/10 p-3 text-sm text-semantic-error"
              >
                {error}
              </p>
            )}

            {/* Bouton principal */}
            <Button
              variant="gold"
              size="lg"
              className="w-full gap-2"
              disabled={submitting}
              onClick={handleConfirm}
            >
              <MessageCircle className="size-5" />
              {submitting ? 'Enregistrement…' : "J'ai effectué le paiement"}
            </Button>

            <p className="text-center text-xs text-brand-muted">
              En cliquant, votre réservation sera enregistrée{' '}
              {support?.whatsapp
                ? 'et vous serez redirigé(e) vers WhatsApp pour notifier l\'équipe.'
                : 'en attente de validation par notre équipe.'}
            </p>
          </div>

          {/* Sidebar résumé */}
          <aside className="h-fit rounded-2xl bg-[linear-gradient(160deg,#0E2450_5%,#2152B6_95%)] p-5 text-white shadow-lg">
            <h2 className="text-lg font-bold">{draft.eventTitle}</h2>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-white/60">Billet</dt>
                <dd className="font-semibold">{draft.ticketName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/60">Places</dt>
                <dd className="font-semibold">{draft.quantity}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/60">Payeur</dt>
                <dd className="font-semibold">{draft.payerPhone}</dd>
              </div>
            </dl>

            <div className="mt-5 flex items-baseline justify-between border-t border-white/15 pt-4">
              <span className="text-lg font-bold">Total</span>
              <span className="text-2xl font-extrabold">{formatPrice(total, draft.currency)}</span>
            </div>

            {/* Liste des participants dans la sidebar */}
            {draft.participants && draft.participants.length > 0 && (
              <div className="mt-4 rounded-xl bg-white/10 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
                  Participants
                </p>
                <ul className="space-y-1">
                  {draft.participants.map((p, i) => (
                    <li key={i} className="text-sm font-medium">
                      {p.firstName} {p.lastName}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-4 rounded-lg bg-white/10 p-3 text-xs text-white/70">
              Votre billet électronique sera envoyé après confirmation du paiement.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
