'use client';

/**
 * Partenaires — logos affichés en défilement automatique continu sur l'accueil.
 *  - GET /api/content/partners (logos gérés depuis Paramètres → Config)
 * Repli sur la liste statique si aucun partenaire enregistré.
 */
import { useEffect, useState } from 'react';

import { PARTNERS } from '@/data/homepageContent';

interface Partner {
  name: string;
  logoUrl?: string;
  description?: string;
}

const FALLBACK: Partner[] = PARTNERS.map((p) => ({ name: p.name, description: p.description }));

function PartnerLogo({ p }: Readonly<{ p: Partner }>) {
  // Logo sans cadre ni fond : juste l'image en object-contain.
  return (
    <div className="flex h-20 w-44 shrink-0 items-center justify-center px-2">
      {p.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.logoUrl}
          alt={p.name}
          loading="lazy"
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

  useEffect(() => {
    import('@/lib/api').then(({ apiFetch }) =>
      apiFetch<{ data: Partner[] }>('/content/partners')
        .then((res) => {
          if (Array.isArray(res.data) && res.data.length > 0) setPartners(res.data);
        })
        .catch(() => {}),
    );
  }, []);

  // On duplique la liste pour un défilement en boucle sans couture.
  const loop = [...partners, ...partners];

  return (
    <section className="border-y border-black/5 bg-brand-cream py-12">
      <div className="container">
        <p className="mb-8 text-center text-xs font-bold uppercase tracking-[0.25em] text-brand-gold">
          Nos partenaires
        </p>
      </div>
      <div className="group relative overflow-hidden">
        <div className="flex w-max animate-[wcg-marquee_30s_linear_infinite] gap-6 group-hover:[animation-play-state:paused]">
          {loop.map((p, i) => (
            <PartnerLogo key={`${p.name}-${i}`} p={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
