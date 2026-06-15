'use client';

/**
 * Porteurs du projet — cartes (photo + nom + rôle) gérées depuis l'admin.
 * Défilement continu fluide (RAF) avec drag manuel souris / swipe tactile.
 *  - GET /api/content/promoters
 * Section masquée s'il n'y a aucun porteur enregistré.
 */
import { useEffect, useState } from 'react';

import { apiFetch } from '@/lib/api';
import { useInfiniteMarquee } from '@/hooks/useInfiniteMarquee';

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

function PromoterCard({ p }: Readonly<{ p: Promoter }>) {
  return (
    <article className="pointer-events-none w-60 shrink-0 select-none overflow-hidden rounded-2xl border border-brand-navy/10 bg-white shadow-sm">
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
  );
}

export function PromotersSection() {
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { containerRef, trackRef, dragProps } = useInfiniteMarquee({
    speed: 40,
    enabled: promoters.length > 0,
    mode: 'pingpong',
  });

  useEffect(() => {
    apiFetch<{ data: Promoter[] }>('/content/promoters')
      .then((res) => setPromoters(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

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

        <div
          ref={containerRef}
          {...dragProps}
          className="relative mt-10 cursor-grab overflow-hidden touch-pan-y active:cursor-grabbing"
        >
          <div ref={trackRef} className="flex w-max gap-6 will-change-transform">
            {promoters.map((p, i) => (
              <PromoterCard key={`${p.name}-${i}`} p={p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
