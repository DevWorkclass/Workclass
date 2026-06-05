import Link from 'next/link';

import { Button } from '@/components/ui/button';
import type { Event } from '@/domains/public/event/types/event.types';
import { formatDateRange } from '@/lib/formatters';

import { Countdown } from './Countdown';

interface HeroSectionProps {
  event: Event;
}

export function HeroSection({ event }: HeroSectionProps) {
  return (
    <section id="accueil" className="relative overflow-hidden bg-brand-navy text-white">
      {/* Lueurs ambiantes */}
      <div
        aria-hidden
        className="bg-brand-gold/6 pointer-events-none absolute -top-40 right-0 size-[700px] rounded-full blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 bottom-0 size-[600px] rounded-full bg-semantic-info/5 blur-3xl"
      />

      <div className="container relative grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-2 lg:gap-14 lg:py-28">
        {/* ── Colonne accroche ── */}
        <div className="max-w-lg">
          <p className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.25em] text-brand-gold">
            <span className="h-px w-8 bg-brand-gold" aria-hidden />
            Libreville &middot; Juillet 2026
          </p>

          <h1 className="text-[2.25rem] font-extrabold leading-[1.06] sm:text-5xl lg:text-6xl">
            L&apos;Élite
            <br />
            Professionnelle
            <br />
            du Gabon
            <br />
            <span className="text-brand-gold">se Réunit.</span>
          </h1>

          <p className="mt-5 text-sm leading-relaxed text-white/60 sm:text-base">
            {event.description}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild variant="gold" size="lg">
              <Link href="/reservation">Réserver maintenant</Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="border border-white/20 bg-transparent text-white hover:bg-white/10"
            >
              <Link href="#evenement">En découvrir plus</Link>
            </Button>
          </div>
        </div>

        {/* ── Carte événement ── */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur-sm">
          <div className="relative flex aspect-[16/9] items-end overflow-hidden rounded-xl bg-gradient-to-br from-[#0a1628] to-[#162d5a]">
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
            />
            <span className="relative z-10 mb-3 ml-3 rounded-full bg-brand-gold px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-navy">
              À la une
            </span>
          </div>

          <div className="px-2 pb-2 pt-4">
            <h2 className="text-lg font-bold text-white">{event.title}</h2>
            <p className="mt-1 text-sm text-white/45">
              {formatDateRange(event.startDate, event.endDate)} &middot; {event.location}
            </p>
            <Countdown target={event.startDate} className="mt-5" variant="dark" />
          </div>
        </div>
      </div>
    </section>
  );
}
