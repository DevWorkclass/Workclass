'use client';

/**
 * Partenaires — logos affichés en défilement continu fluide sur l'accueil.
 *  - GET /api/content/partners (logos gérés depuis Paramètres → Config)
 * Défilement infini (RAF) avec drag manuel souris / swipe tactile.
 * Repli sur la liste statique si aucun partenaire enregistré.
 */
import { useEffect, useState } from 'react';

import { PARTNERS } from '@/data/homepageContent';
import { useInfiniteMarquee } from '@/hooks/useInfiniteMarquee';

interface Partner {
  name: string;
  logoUrl?: string;
  description?: string;
}

const FALLBACK: Partner[] = PARTNERS.map((p) => ({ name: p.name, description: p.description }));

function PartnerLogo({ p }: Readonly<{ p: Partner }>) {
  return (
    <div className="pointer-events-none flex h-20 w-44 shrink-0 items-center justify-center px-2 select-none">
      {p.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.logoUrl}
          alt={p.name}
          loading="lazy"
          draggable={false}
          className="max-h-16 max-w-full object-contain"
        />
      ) : (
        <span className="text-center text-sm font-bold text-brand-navy">{p.name}</span>
      )}
    </div>
  );
}

export function PartnersSection() {
  const [partners, setPartners] = useState<Partner[]>(FALLBACK);
  const { containerRef, trackRef, dragProps } = useInfiniteMarquee({ speed: 50 });

  useEffect(() => {
    import('@/lib/api').then(({ apiFetch }) =>
      apiFetch<{ data: Partner[] }>('/content/partners')
        .then((res) => {
          if (Array.isArray(res.data) && res.data.length > 0) setPartners(res.data);
        })
        .catch(() => {}),
    );
  }, []);

  // Duplique la liste pour la boucle sans couture.
  const loop = [...partners, ...partners];

  return (
    <section className="border-y border-black/5 bg-brand-cream py-12">
      <div className="container">
        <p className="mb-8 text-center text-xs font-bold uppercase tracking-[0.25em] text-brand-gold">
          Nos partenaires
        </p>
      </div>
      <div
        ref={containerRef}
        {...dragProps}
        className="relative cursor-grab overflow-hidden touch-pan-y active:cursor-grabbing"
      >
        <div ref={trackRef} className="flex w-max gap-6 will-change-transform">
          {loop.map((p, i) => (
            <PartnerLogo key={`${p.name}-${i}`} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
