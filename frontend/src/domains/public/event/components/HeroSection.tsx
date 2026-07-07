'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { Event } from '@/domains/public/event/types/event.types';
import { formatDateRange } from '@/lib/formatters';
import { apiFetch } from '@/lib/api';
import { ROUTES } from '@/constants/routes';

import { Countdown } from './Countdown';

interface HeroSectionProps {
  event: Event;
}

/**
 * Fenêtre contextuelle « En découvrir plus » — contenu configurable depuis
 * Paramètres → Config (`/content/about`). Apparition fluide (fondu + échelle).
 */
function AboutModal({ reserveHref, onClose }: { reserveHref: string; onClose: () => void }) {
  const [about, setAbout] = useState<{ title: string; content: string } | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    apiFetch<{ data: { title: string; content: string } }>('/content/about')
      .then((res) => setAbout(res.data))
      .catch(() => setAbout({ title: 'À propos', content: '' }));
    return () => cancelAnimationFrame(id);
  }, []);

  const close = () => {
    setShown(false);
    setTimeout(onClose, 200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="En découvrir plus"
      className={`fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4 transition-opacity duration-200 ${
        shown ? 'opacity-100' : 'opacity-0'
      }`}
      onMouseDown={close}
    >
      <div
        className={`max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 text-brand-navy shadow-2xl transition-all duration-200 sm:p-8 ${
          shown ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
        }`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-2xl font-extrabold text-brand-navy">{about?.title ?? 'À propos'}</h2>
          <button
            type="button"
            onClick={close}
            aria-label="Fermer"
            className="rounded-full p-1.5 text-brand-muted transition-colors hover:bg-brand-cream hover:text-brand-navy"
          >
            <X className="size-5" />
          </button>
        </div>

        {about ? (
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-brand-navy/80">
            {about.content}
          </p>
        ) : (
          <p className="mt-4 text-sm text-brand-muted">Chargement…</p>
        )}

        <div className="mt-6 flex justify-end">
          <Button asChild variant="gold">
            <Link href={reserveHref}>Réserver ma place</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function HeroSection({ event }: HeroSectionProps) {
  const detailHref = event.slug ? ROUTES.public.eventDetail(event.slug) : '#evenements';
  const reserveHref = event.slug
    ? `${ROUTES.public.reservation.base}?event=${event.slug}`
    : ROUTES.public.reservation.base;
  const [aboutOpen, setAboutOpen] = useState(false);

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

      <div className="container relative grid items-center gap-8 py-12 sm:py-20 lg:grid-cols-2 lg:gap-14 lg:py-28">
        {/* ── Colonne accroche ── */}
        <div className="text-center lg:text-left">
          {/* Logo officiel (identique à l'écran de chargement) — complet, sans fond ni contour */}
          <div className="mb-6 flex justify-center lg:justify-start">
            <Image
              src="/assets/images/logo/logo.png"
              alt="Work Class Gabon"
              width={480}
              height={270}
              priority
              className="h-32 w-auto object-contain sm:h-48 lg:h-64"
            />
          </div>

          <p className="mb-4 inline-flex items-center gap-3 text-xs font-bold uppercase tracking-[0.25em] text-brand-gold">
            <span className="h-px w-6 bg-brand-gold lg:w-8" aria-hidden />
            Événement à la une
            <span className="h-px w-6 bg-brand-gold lg:hidden" aria-hidden />
          </p>

          <h1 className="text-[1.6rem] font-extrabold leading-[1.12] sm:text-4xl lg:text-[2.75rem]">
            Les <span className="text-brand-gold">WorkClass</span> du Transport et de la Logistique
            <span className="mt-2 block text-lg font-bold text-white/80 sm:text-xl lg:text-2xl">
              
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/60 sm:text-base lg:mx-0">
            {event.description}
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3 lg:justify-start">
            <Button asChild variant="gold" size="lg">
              <Link href={reserveHref}>Réserver maintenant</Link>
            </Button>
            <Button
              size="lg"
              className="border border-white/20 bg-transparent text-white hover:bg-white/10"
              onClick={() => setAboutOpen(true)}
            >
              En découvrir plus
            </Button>
          </div>
        </div>

        {/* ── Carte événement ── */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur-sm">
          {/* Image de couverture */}
          <div className="relative flex aspect-[16/9] items-end overflow-hidden rounded-xl bg-gradient-to-br from-[#0a1628] to-[#162d5a]">
            {event.coverImage && (
              <Image
                src={event.coverImage}
                alt={event.title}
                fill
                priority
                unoptimized
                className="absolute inset-0 object-cover"
              />
            )}
            {/* Dégradé sombre pour lisibilité du badge */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
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

            {/* Lien vers le détail de l'événement */}
            <Link
              href={detailHref}
              className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-white/20 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              Voir les détails →
            </Link>
          </div>
        </div>
      </div>

      {aboutOpen && <AboutModal reserveHref={reserveHref} onClose={() => setAboutOpen(false)} />}
    </section>
  );
}
