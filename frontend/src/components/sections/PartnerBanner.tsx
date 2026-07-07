'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import { AD_SLIDES, type AdSlide } from '@/data/homepageContent';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

/** Palette de secours pour les annonces gérées sans visuel personnalisé. */
const PALETTES = [
  { fromColor: '#0D2145', toColor: '#1d4ed8', textColor: '#C8A84B' },
  { fromColor: '#7c2d12', toColor: '#c2410c', textColor: '#FED7AA' },
  { fromColor: '#064e3b', toColor: '#059669', textColor: '#6ee7b7' },
  { fromColor: '#78350f', toColor: '#d97706', textColor: '#fef3c7' },
];

interface BackendAd {
  tag?: string;
  title: string;
  body?: string;
  cta?: string;
  href?: string;
  imageUrl?: string;
  active: boolean;
}

interface PartnerBannerProps {
  initialAds?: BackendAd[] | null;
}

/** Convertit une annonce backend en slide (génère un visuel par défaut). */
function toSlide(ad: BackendAd, i: number): AdSlide {
  const p = PALETTES[i % PALETTES.length]!;
  return {
    id: `ad-${i}`,
    tag: ad.tag ?? '',
    title: ad.title,
    body: ad.body ?? '',
    cta: ad.cta || undefined,
    href: ad.href || undefined,
    imageUrl: ad.imageUrl || undefined,
    visual: {
      fromColor: p.fromColor,
      toColor: p.toColor,
      textColor: p.textColor,
      initial: ad.title.trim().charAt(0).toUpperCase() || '★',
    },
  };
}

export function PartnerBanner({ initialAds }: PartnerBannerProps = {}) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [slides, setSlides] = useState<AdSlide[]>(() => {
    if (initialAds && initialAds.length > 0) {
      const active = initialAds.filter((a) => a.active);
      if (active.length > 0) return active.map(toSlide);
    }
    return AD_SLIDES;
  });

  useEffect(() => {
    if (initialAds) return;
    apiFetch<{ data: BackendAd[] }>('/content/ads')
      .then((res) => {
        const active = (res.data ?? []).filter((a) => a.active);
        if (active.length > 0) {
          setSlides(active.map(toSlide));
          setCurrent(0);
        }
      })
      .catch(() => {});
  }, [initialAds]);

  const total = slides.length;

  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next, paused]);

  // --- Drag / swipe entre slides (souris + tactile) ---
  const dragRef = useRef<{ active: boolean; startX: number; pointerId: number | null }>({
    active: false,
    startX: 0,
    pointerId: null,
  });
  const bannerRef = useRef<HTMLDivElement>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { active: true, startX: e.clientX, pointerId: e.pointerId };
    setPaused(true);
    try {
      bannerRef.current?.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const delta = e.clientX - dragRef.current.startX;
    dragRef.current = { active: false, startX: 0, pointerId: null };
    setPaused(false);
    if (Math.abs(delta) > 40) {
      if (delta < 0) next();
      else prev();
    }
  };

  return (
    <section
      className="bg-brand-navy"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container py-5">
        {/* Bannière */}
        <div
          ref={bannerRef}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="relative h-[200px] cursor-grab touch-pan-y overflow-hidden rounded-xl active:cursor-grabbing"
        >
          {slides.map((slide, i) => {
            const isActive = i === current;
            return (
              <div
                key={slide.id}
                {...(isActive ? {} : { 'aria-hidden': true })}
                className={cn(
                  'absolute inset-0 flex transition-opacity duration-500',
                  isActive ? 'opacity-100' : 'pointer-events-none opacity-0',
                )}
              >
                {/* ── Couverture portrait (ratio ~2:3) ── */}
                <div
                  className="relative w-[130px] shrink-0 overflow-hidden sm:w-[136px]"
                  style={{
                    background: `linear-gradient(160deg, ${slide.visual.fromColor}, ${slide.visual.toColor})`,
                  }}
                >
                  {slide.imageUrl ? (
                    <Image
                      src={slide.imageUrl}
                      alt={slide.title}
                      fill
                      priority={i === 0}
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    /* Placeholder couverture */
                    <div className="flex h-full flex-col items-end justify-between p-3">
                      <span
                        className="text-[9px] font-bold uppercase tracking-widest opacity-60"
                        style={{ color: slide.visual.textColor }}
                      >
                        {slide.tag}
                      </span>
                      <span
                        className="text-3xl font-extrabold leading-none"
                        style={{ color: slide.visual.textColor }}
                      >
                        {slide.visual.initial}
                      </span>
                    </div>
                  )}
                </div>

                {/* ── Zone texte ── */}
                <div className="flex flex-1 flex-col justify-center gap-3 border-l border-white/10 bg-white/5 px-6">
                  <div className="min-w-0">
                    <span
                      className="mb-1.5 inline-block text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: slide.visual.toColor }}
                    >
                      {slide.tag}
                    </span>
                    <p className="line-clamp-2 text-sm font-bold leading-snug text-white sm:text-base">{slide.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-white/55 sm:text-sm">{slide.body}</p>
                  </div>
                  {slide.cta && slide.href ? (
                    /^https?:\/\//i.test(slide.href) ? (
                      // Lien externe : nouvel onglet (l'utilisateur reste sur le site).
                      <a
                        href={slide.href}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="w-fit rounded-full bg-brand-gold px-5 py-2 text-xs font-bold text-brand-navy transition-colors hover:bg-brand-gold-hover"
                      >
                        {slide.cta}
                      </a>
                    ) : (
                      <Link
                        href={slide.href}
                        className="w-fit rounded-full bg-brand-gold px-5 py-2 text-xs font-bold text-brand-navy transition-colors hover:bg-brand-gold-hover"
                      >
                        {slide.cta}
                      </Link>
                    )
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Contrôles */}
        <div className="mt-2.5 flex items-center justify-between px-1">
          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Publicité ${i + 1}`}
                className={cn(
                  'h-1 rounded-full transition-all duration-300',
                  i === current ? 'w-5 bg-brand-gold' : 'w-1.5 bg-white/25 hover:bg-white/50',
                )}
              />
            ))}
          </div>
          {/* Flèches */}
          <div className="flex gap-1">
            <button
              onClick={prev}
              aria-label="Précédent"
              className="flex size-6 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              onClick={next}
              aria-label="Suivant"
              className="flex size-6 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
