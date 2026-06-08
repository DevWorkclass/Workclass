'use client';

/**
 * « Au service de toutes les industries » — tuiles éditables depuis l'admin.
 *  - GET /api/content/industries (nom + image)
 * Repli sur la liste statique si rien n'est enregistré.
 */
import { useEffect, useState } from 'react';

import { INDUSTRIES } from '@/data/homepageContent';

interface Industry {
  name: string;
  imageUrl?: string;
}

const TILE_GRADIENTS = [
  'from-[#0a2510] to-[#15803d]',
  'from-[#0a1628] to-[#1d4ed8]',
  'from-[#251500] to-[#b45309]',
  'from-[#1a0a30] to-[#6d28d9]',
  'from-[#0a2a20] to-[#0f766e]',
  'from-[#251a00] to-[#92400e]',
  'from-[#0a1a28] to-[#0369a1]',
  'from-[#200a0a] to-[#991b1b]',
];

const FALLBACK: Industry[] = INDUSTRIES.map((name) => ({ name }));

export function IndustriesSection() {
  const [items, setItems] = useState<Industry[]>(FALLBACK);

  useEffect(() => {
    import('@/lib/api').then(({ apiFetch }) =>
      apiFetch<{ data: Industry[] }>('/content/industries')
        .then((res) => {
          if (Array.isArray(res.data) && res.data.length > 0) setItems(res.data);
        })
        .catch(() => {}),
    );
  }, []);

  return (
    <section className="bg-brand-navy py-16 text-white">
      <div className="container">
        <p className="mb-2 text-center text-xs font-bold uppercase tracking-[0.25em] text-brand-gold">
          Domaines couverts
        </p>
        <h2 className="text-center text-2xl font-bold sm:text-3xl">
          Au service de toutes les industries
        </h2>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {items.map((item, i) => (
            <div
              key={`${item.name}-${i}`}
              className={`relative flex aspect-square items-end overflow-hidden rounded-xl bg-cover bg-center ring-1 ring-white/10 ${item.imageUrl ? '' : `bg-gradient-to-br ${TILE_GRADIENTS[i % TILE_GRADIENTS.length]}`}`}
              style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : undefined}
            >
              <span className="w-full bg-gradient-to-t from-black/70 to-transparent p-3 text-sm font-semibold">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
