'use client';

/**
 * Réservation — Étape 1/3 : choix du type de billet et du nombre de places.
 * État local (sélection + quantité) ; transmis à l'étape suivante via query.
 * Le calcul de prix faisant foi reste côté backend ; ici, affichage indicatif.
 */
import { Check, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { formatAmount, formatDateRange, formatPrice } from '@/lib/formatters';
import type { Event } from '@/domains/public/event/types/event.types';
import type { TicketType } from '@/domains/public/booking/types/booking.types';

interface ReservationStep1Props {
  event: Event;
  ticketTypes: TicketType[];
  maxQuantity?: number;
}

const STEPS = ['Type de billet', 'Vos informations', 'Paiement'] as const;

export function ReservationStep1({ event, ticketTypes, maxQuantity = 10 }: ReservationStep1Props) {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'fr';

  const [selectedId, setSelectedId] = useState<string>(ticketTypes[0]?.id ?? '');
  const [quantity, setQuantity] = useState<number>(1);

  const selected = useMemo(
    () => ticketTypes.find((t) => t.id === selectedId) ?? ticketTypes[0],
    [ticketTypes, selectedId],
  );

  const total = selected ? selected.price * quantity : 0;

  const decrement = () => setQuantity((q) => Math.max(1, q - 1));
  const increment = () => setQuantity((q) => Math.min(maxQuantity, q + 1));

  function handleContinue() {
    const query = new URLSearchParams({ type: selectedId, qty: String(quantity) });
    router.push(`/${locale}/reservation/etape-2?${query.toString()}`);
  }

  return (
    <main className="bg-brand-cream py-10 lg:py-14">
      <div className="container">
        {/* En-tête */}
        <header className="mb-8">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand-gold">
            <span className="h-px w-6 bg-brand-gold" aria-hidden />
            Inscription
          </p>
          <h1 className="mt-3 text-4xl font-extrabold text-brand-navy lg:text-5xl">
            Réservez votre place
          </h1>
        </header>

        {/* Stepper */}
        <ol className="mb-8 grid grid-cols-1 gap-2 rounded-full bg-white p-2 shadow-sm sm:grid-cols-3">
          {STEPS.map((label, index) => {
            const isActive = index === 0;
            return (
              <li
                key={label}
                aria-current={isActive ? 'step' : undefined}
                className={`flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold ${
                  isActive ? 'bg-brand-navy text-white' : 'text-brand-muted'
                }`}
              >
                {index + 1} · {label}
              </li>
            );
          })}
        </ol>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Sélection */}
          <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm lg:p-8">
            <h2 className="text-2xl font-bold text-brand-navy">Choisissez votre billet</h2>

            <div
              role="radiogroup"
              aria-label="Type de billet"
              className="mt-6 grid gap-4 sm:grid-cols-2"
            >
              {ticketTypes.map((type) => {
                const isSelected = type.id === selectedId;
                return (
                  <button
                    key={type.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedId(type.id)}
                    className={`relative rounded-2xl border p-5 text-left transition-colors ${
                      isSelected
                        ? 'border-brand-gold bg-gradient-to-br from-brand-gold/20 to-brand-gold/5'
                        : 'border-black/10 bg-white hover:border-brand-gold/50'
                    }`}
                  >
                    {type.badge ? (
                      <span className="absolute right-4 top-4 rounded-full bg-brand-gold/15 px-2.5 py-0.5 text-xs font-semibold text-brand-gold">
                        {type.badge}
                      </span>
                    ) : null}
                    <p className="font-bold text-brand-navy">{type.name}</p>
                    <p className="mt-1 text-3xl font-extrabold text-brand-gold">
                      {formatAmount(type.price)}
                      <span className="ml-1 text-sm font-semibold text-brand-muted">
                        {type.currency}
                      </span>
                    </p>
                    <ul className="mt-4 space-y-2">
                      {type.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm text-brand-navy/80"
                        >
                          <Check className="mt-0.5 size-3.5 shrink-0 text-brand-gold" aria-hidden />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            {/* Quantité */}
            <div className="mt-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-brand-muted">
                Nombre de places
              </p>
              <div className="mt-3 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={decrement}
                  disabled={quantity <= 1}
                  aria-label="Retirer une place"
                  className="flex size-11 items-center justify-center rounded-lg border border-black/10 bg-brand-cream text-brand-navy transition-colors hover:bg-brand-gold/15 disabled:opacity-40"
                >
                  <Minus className="size-4" />
                </button>
                <span
                  aria-live="polite"
                  className="min-w-8 text-2xl font-bold text-brand-gold"
                >
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={increment}
                  disabled={quantity >= maxQuantity}
                  aria-label="Ajouter une place"
                  className="flex size-11 items-center justify-center rounded-lg border border-black/10 bg-brand-cream text-brand-navy transition-colors hover:bg-brand-gold/15 disabled:opacity-40"
                >
                  <Plus className="size-4" />
                </button>
                <span className="text-sm text-brand-muted">place(s)</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 space-y-3">
              <Button asChild variant="navy" size="lg" className="w-full">
                <Link href={`/${locale}`}>Évènement</Link>
              </Button>
              <Button
                variant="navy"
                size="lg"
                className="w-full"
                onClick={handleContinue}
                disabled={!selected}
              >
                Continuer
              </Button>
            </div>
          </section>

          {/* Récapitulatif */}
          <aside className="h-fit rounded-2xl bg-[linear-gradient(160deg,#0E2450_5%,#2152B6_95%)] p-5 text-white shadow-lg">
            <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-brand-navy-deep">
              {event.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.coverImage}
                  alt={event.title}
                  className="size-full object-cover"
                  loading="lazy"
                />
              ) : null}
            </div>

            <h2 className="mt-5 text-xl font-bold">{event.title}</h2>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-white/60">Type de billet</dt>
                <dd className="font-semibold">{selected?.name ?? '—'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/60">Date</dt>
                <dd className="text-right font-semibold">
                  {formatDateRange(event.startDate, event.endDate)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/60">Lieu</dt>
                <dd className="text-right font-semibold">{event.location}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/60">Quantité</dt>
                <dd className="font-semibold">{quantity}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/60">Prix unitaire</dt>
                <dd className="font-semibold">
                  {selected ? formatPrice(selected.price, selected.currency) : '—'}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex items-baseline justify-between border-t border-white/15 pt-4">
              <span className="text-lg font-bold">Total</span>
              <span className="text-2xl font-extrabold">
                {formatPrice(total, selected?.currency ?? 'FCFA')}
              </span>
            </div>

            <p className="mt-4 rounded-lg bg-white/10 p-3 text-xs text-white/70">
              Billet électronique + Certificat de participation inclus dans tous les billets.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
