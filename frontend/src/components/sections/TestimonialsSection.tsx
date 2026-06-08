'use client';

/**
 * Témoignages — avis approuvés récupérés du backend, affichés en carrousel
 * à défilement automatique (intervalle configurable, défaut 4s) et manuel.
 *  - GET /api/content/testimonials  : avis approuvés (nom anonymisé, événement, note)
 *  - GET /api/content/app-config    : intervalle + activation du défilement auto
 * Repli sur les témoignages statiques si aucun avis publié.
 */
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { TESTIMONIALS } from '@/data/homepageContent';
import { apiFetch } from '@/lib/api';

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
}

const FALLBACK: Testimonial[] = TESTIMONIALS.map((t) => ({
  name: t.name,
  role: t.role,
  content: t.content,
  rating: t.rating,
}));

export function TestimonialsSection() {
  const [items, setItems] = useState<Testimonial[]>(FALLBACK);
  const [intervalMs, setIntervalMs] = useState(4000);
  const [autoScroll, setAutoScroll] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    apiFetch<{ data: { name: string; event: string; comment: string; rating: number }[] }>(
      '/content/testimonials',
    )
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setItems(
            res.data.map((t) => ({
              name: t.name,
              role: t.event,
              content: t.comment,
              rating: t.rating,
            })),
          );
        }
      })
      .catch(() => {});

    apiFetch<{ data: { testimonialIntervalMs: number; testimonialAutoScroll: boolean } }>(
      '/content/app-config',
    )
      .then((res) => {
        setIntervalMs(res.data.testimonialIntervalMs);
        setAutoScroll(res.data.testimonialAutoScroll);
      })
      .catch(() => {});
  }, []);

  const step = useCallback((dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector('article');
    const delta = (card ? card.clientWidth : 320) + 24; // largeur carte + gap
    // Boucle : revient au début lorsqu'on atteint la fin.
    if (dir === 1 && track.scrollLeft + track.clientWidth >= track.scrollWidth - 8) {
      track.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      track.scrollBy({ left: dir * delta, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (!autoScroll) return;
    const id = setInterval(() => {
      if (!pausedRef.current) step(1);
    }, Math.max(1000, intervalMs));
    return () => clearInterval(id);
  }, [autoScroll, intervalMs, step]);

  return (
    <section className="bg-brand-navy py-16 text-white">
      <div className="container">
        <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.25em] text-brand-gold">
          Témoignages
        </p>
        <h2 className="text-center text-3xl font-extrabold">
          Ce que disent nos <span className="text-brand-gold">participants</span>
        </h2>

        <div className="relative mt-12">
          <div
            ref={trackRef}
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onMouseEnter={() => (pausedRef.current = true)}
            onMouseLeave={() => (pausedRef.current = false)}
            onFocusCapture={() => (pausedRef.current = true)}
            onBlurCapture={() => (pausedRef.current = false)}
          >
            {items.map((t, i) => (
              <article
                key={`${t.name}-${i}`}
                className="flex w-72 shrink-0 snap-start flex-col rounded-2xl border border-white/10 bg-white/5 p-6 sm:w-80"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: Math.max(1, Math.min(5, t.rating)) }).map((_, j) => (
                    <Star key={j} className="size-4 fill-brand-gold text-brand-gold" />
                  ))}
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-white/70">
                  &ldquo;{t.content}&rdquo;
                </p>
                <div className="mt-6 border-t border-white/10 pt-4">
                  <p className="font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-white/45">{t.role}</p>
                </div>
              </article>
            ))}
          </div>

          {/* Contrôles manuels */}
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Témoignage précédent"
              className="grid size-10 place-items-center rounded-full border border-white/20 text-white/80 transition-colors hover:bg-white/10"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Témoignage suivant"
              className="grid size-10 place-items-center rounded-full border border-white/20 text-white/80 transition-colors hover:bg-white/10"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
