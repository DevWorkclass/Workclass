'use client';

/**
 * Partenaires — logos affichés en défilement continu fluide sur l'accueil.
 *  - GET /api/content/partners (logos gérés depuis Paramètres → Config)
 * Défilement infini (RAF) avec drag manuel souris / swipe tactile.
 * Repli sur la liste statique si aucun partenaire enregistré.
 */
import { useEffect, useState } from 'react';
import Image from 'next/image';

import { PARTNERS } from '@/data/homepageContent';
import { useInfiniteMarquee } from '@/hooks/useInfiniteMarquee';

interface Partner {
  name: string;
  logoUrl?: string;
  description?: string;
}

interface PartnersSectionProps {
  initialPartners?: Partner[] | null;
}

const FALLBACK: Partner[] = PARTNERS.map((p) => ({ name: p.name, description: p.description }));

function PartnerLogo({ p }: Readonly<{ p: Partner }>) {
  return (
    <div className="pointer-events-none flex h-20 w-44 shrink-0 items-center justify-center px-2 select-none">
      {p.logoUrl ? (
        <Image
          src={p.logoUrl}
          alt={p.name}
          width={160}
          height={64}
          unoptimized
          className="max-h-16 w-auto max-w-full object-contain"
        />
      ) : (
        <span className="text-center text-sm font-bold text-brand-navy">{p.name}</span>
      )}
    </div>
  );
}

export function PartnersSection({ initialPartners }: PartnersSectionProps = {}) {
  const [partners, setPartners] = useState<Partner[]>(() => {
    if (initialPartners && initialPartners.length > 0) return initialPartners;
    return FALLBACK;
  });
  const { containerRef, trackRef, dragProps } = useInfiniteMarquee({ speed: 50 });

  useEffect(() => {
    if (initialPartners) return;
    import('@/lib/api').then(({ apiFetch }) =>
      apiFetch<{ data: Partner[] }>('/content/partners')
        .then((res) => {
          if (Array.isArray(res.data) && res.data.length > 0) setPartners(res.data);
        })
        .catch(() => {}),
    );
  }, [initialPartners]);

  // Boucle sans couture : deux groupes IDENTIQUES côte à côte ; le hook
  // remet l'offset à 0 quand on a parcouru exactement un groupe (gap inclus).
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
          <div className="flex shrink-0 gap-6">
            {partners.map((p, i) => (
              <PartnerLogo key={`a-${p.name}-${i}`} p={p} />
            ))}
          </div>
          <div className="flex shrink-0 gap-6" aria-hidden>
            {partners.map((p, i) => (
              <PartnerLogo key={`b-${p.name}-${i}`} p={p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
