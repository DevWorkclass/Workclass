/**
 * Hero de la page d'accueil — mise en avant de l'événement unique.
 * Colonne gauche: accroche + CTA. Colonne droite: carte événement + countdown.
 */
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { BRAND_PILLARS } from '@/data/homepageContent';
import { formatDateRange } from '@/lib/formatters';
import type { Event } from '@/domains/public/event/types/event.types';

import { Countdown } from './Countdown';

interface HeroSectionProps {
  event: Event;
}

export function HeroSection({ event }: HeroSectionProps) {
  const eyebrow = `${event.location.split(',')[0]} · ${new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric',
  })
    .format(event.startDate)
    .toUpperCase()}`;

  return (
    <section
      id="accueil"
      className="relative overflow-hidden bg-brand-cream"
    >
      {/* Voile décoratif */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-navy/5 to-transparent"
      />

      <div className="container relative grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
        {/* Colonne accroche */}
        <div className="max-w-xl">
          <p className="mb-4 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.2em] text-brand-gold">
            <span className="h-px w-8 bg-brand-gold" aria-hidden />
            {eyebrow}
          </p>

          <h1 className="text-4xl font-extrabold leading-[1.1] text-brand-navy sm:text-5xl">
            Agriculture : de la production à{' '}
            <span className="text-brand-gold">l&apos;exportation.</span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-brand-muted">
            {event.description}
          </p>

          <ul className="mt-6 flex flex-wrap gap-2">
            {BRAND_PILLARS.map((pillar) => (
              <li
                key={pillar}
                className="rounded-full bg-brand-navy/5 px-3 py-1 text-xs font-semibold text-brand-navy"
              >
                {pillar}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="gold" size="lg">
              <Link href="/reservation">Réserver ma place</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#evenement">Découvrir l&apos;événement</Link>
            </Button>
          </div>
        </div>

        {/* Colonne carte événement */}
        <div className="rounded-2xl border border-brand-navy/10 bg-white p-3 shadow-xl shadow-brand-navy/5">
          <div className="relative flex aspect-[16/9] items-end overflow-hidden rounded-xl bg-brand-navy/80">
            {/* TODO: image de couverture event.coverImage */}
            <span className="absolute left-3 top-3 rounded-full bg-brand-gold px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-navy">
              À la une
            </span>
          </div>

          <div className="px-3 pb-2 pt-4">
            <h2 className="text-xl font-bold text-brand-navy">{event.title}</h2>
            <p className="mt-1 text-sm text-brand-muted">
              {formatDateRange(event.startDate, event.endDate)} · {event.location}
            </p>

            <Countdown target={event.startDate} className="mt-5" />
          </div>
        </div>
      </div>
    </section>
  );
}
