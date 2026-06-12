'use client';

/**
 * Porteurs du projet — cartes (photo + nom + rôle) gérées depuis l'admin,
 * en défilement semi-automatique (auto toutes les 3,5 s, pause au survol, flèches).
 *  - GET /api/content/promoters
 * Section masquée s'il n'y a aucun porteur enregistré.
 */
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { apiFetch } from '@/lib/api';

interface Promoter {
  name: string;
  role?: string;
  photoUrl?: string;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function PromotersSection() {
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [loaded, setLoaded] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  useEffect(() => {
    apiFetch<{ data: Promoter[] }>('/content/promoters')
      .then((res) => setPromoters(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const step = useCallback((dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector('article');
    const delta = (card ? card.clientWidth : 260) + 24;
    if (dir === 1 && track.scrollLeft + track.clientWidth >= track.scrollWidth - 8) {
      track.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      track.scrollBy({ left: dir * delta, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (promoters.length === 0) return;
    const id = setInterval(() => {
      if (!pausedRef.current) step(1);
    }, 3500);
    return () => clearInterval(id);
  }, [promoters.length, step]);

  if (loaded && promoters.length === 0) return null;

  return (
    <section id="porteurs" className="py-16">
      <div className="container">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand-gold">
          Porteurs du projet
        </p>
        <h2 className="text-3xl font-extrabold text-brand-navy">
          Celles &amp; ceux qui <span className="text-brand-gold">portent l&apos;initiative</span>
        </h2>

        <div className="relative mt-10">
          <div
            ref={trackRef}
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onMouseEnter={() => (pausedRef.current = true)}
            onMouseLeave={() => (pausedRef.current = false)}
            onFocusCapture={() => (pausedRef.current = true)}
            onBlurCapture={() => (pausedRef.current = false)}
          >
            {promoters.map((p, i) => (
              <article
                key={`${p.name}-${i}`}
                className="w-60 shrink-0 snap-start overflow-hidden rounded-2xl border border-brand-navy/10 bg-white shadow-sm"
              >
                <div
                  className="flex aspect-square items-center justify-center bg-gradient-to-br from-brand-navy to-[#2152B6] bg-cover bg-center"
                  style={p.photoUrl ? { backgroundImage: `url(${p.photoUrl})` } : undefined}
                  role="img"
                  aria-label={p.name}
                >
                  {!p.photoUrl && (
                    <span className="text-4xl font-extrabold text-white/90">{initialsOf(p.name)}</span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-brand-navy">{p.name}</h3>
                  {p.role && <p className="text-sm text-brand-muted">{p.role}</p>}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Précédent"
              className="grid size-10 place-items-center rounded-full border border-brand-navy/15 text-brand-navy/70 transition-colors hover:bg-brand-navy/5"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Suivant"
              className="grid size-10 place-items-center rounded-full border border-brand-navy/15 text-brand-navy/70 transition-colors hover:bg-brand-navy/5"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
