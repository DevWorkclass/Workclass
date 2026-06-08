'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

import { AD_SLIDES } from '@/data/homepageContent';
import { cn } from '@/lib/utils';

export function PartnerBanner() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = AD_SLIDES.length;

  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(next, 5000);
    return () => clearInterval(id);
  }, [next, paused]);

  return (
    <section
      className="bg-brand-navy"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container py-5">
        {/* Bannière */}
        <div className="relative h-[200px] overflow-hidden rounded-xl">
          {AD_SLIDES.map((slide, i) => {
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
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={slide.imageUrl}
                      alt={slide.title}
                      className="size-full object-cover"
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
                  {slide.cta && (
                    <Link
                      href={slide.href ?? '#'}
                      className="w-fit rounded-full bg-brand-gold px-5 py-2 text-xs font-bold text-brand-navy transition-colors hover:bg-brand-gold-hover"
                    >
                      {slide.cta}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Contrôles */}
        <div className="mt-2.5 flex items-center justify-between px-1">
          {/* Dots */}
          <div className="flex items-center gap-1.5">
            {AD_SLIDES.map((_, i) => (
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
