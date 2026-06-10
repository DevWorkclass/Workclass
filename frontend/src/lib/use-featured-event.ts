'use client';

/**
 * Hook — slug de l'événement « à la une » (le plus récent publié, avec billets).
 * Sert aux CTA génériques (navbar, hero, CTA final) pour réserver l'événement vedette.
 * Renvoie null tant qu'aucun événement réservable n'est disponible.
 */
import { useEffect, useState } from 'react';

import { getPublicEvents } from '@/lib/events-cache';

export function useFeaturedEventSlug(): string | null {
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPublicEvents()
      .then((data) => {
        if (!active) return;
        const featured = [...data]
          .filter((e) => e.ticketTypes.length > 0)
          .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
        if (featured) setSlug(featured.slug);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return slug;
}

/** Construit l'URL de réservation pour l'événement vedette (ou la liste si inconnu). */
export function featuredReserveHref(slug: string | null): string {
  return slug ? `/reservation?event=${slug}` : '/evenements';
}
