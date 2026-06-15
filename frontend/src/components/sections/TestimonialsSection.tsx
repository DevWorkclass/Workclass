'use client';

/**
 * Témoignages — avis approuvés récupérés du backend, affichés en carrousel
 * à défilement continu fluide (RAF) avec drag manuel souris / swipe tactile.
 *  - GET /api/content/testimonials  : avis approuvés (nom anonymisé, événement, note)
 *  - GET /api/content/app-config    : activation du défilement auto
 * Repli sur les témoignages statiques si aucun avis publié.
 */
import { Star } from 'lucide-react';
import { useEffect, useState } from 'react';

import { TESTIMONIALS } from '@/data/homepageContent';
import { apiFetch } from '@/lib/api';
import { useInfiniteMarquee } from '@/hooks/useInfiniteMarquee';

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

function TestimonialCard({ t }: Readonly<{ t: Testimonial }>) {
  return (
    <article className="pointer-events-none flex w-72 shrink-0 select-none flex-col rounded-2xl border border-white/10 bg-white/5 p-6 sm:w-80">
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
  );
}

export function TestimonialsSection() {
  const [items, setItems] = useState<Testimonial[]>(FALLBACK);
  const [autoScroll, setAutoScroll] = useState(true);

  const { containerRef, trackRef, dragProps } = useInfiniteMarquee({
    speed: 35,
    enabled: autoScroll && items.length > 0,
  });

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

    apiFetch<{ data: { testimonialAutoScroll: boolean } }>('/content/app-config')
      .then((res) => setAutoScroll(res.data.testimonialAutoScroll))
      .catch(() => {});
  }, []);

  const loop = [...items, ...items];

  return (
    <section className="bg-brand-navy py-16 text-white">
      <div className="container">
        <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.25em] text-brand-gold">
          Témoignages
        </p>
        <h2 className="text-center text-3xl font-extrabold">
          Ce que disent nos <span className="text-brand-gold">participants</span>
        </h2>

        <div
          ref={containerRef}
          {...dragProps}
          className="relative mt-12 cursor-grab overflow-hidden touch-pan-y active:cursor-grabbing"
        >
          <div ref={trackRef} className="flex w-max gap-6 will-change-transform">
            {loop.map((t, i) => (
              <TestimonialCard key={`${t.name}-${i}`} t={t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
