'use client';

/**
 * Événement « à la une » : choisi depuis l'admin (`/content/featured`),
 * sinon le dernier événement publié (de préférence avec des billets).
 * Utilisé par le hero, la navbar et le CTA final.
 */
import { useEffect, useState } from 'react';

import { getPublicEvents } from '@/lib/events-cache';
import { apiFetch } from '@/lib/api';
import type { PublicEvent } from '@/lib/public-event';

/** Résout l'événement vedette (objet complet) ou null. */
export async function getFeaturedEvent(): Promise<PublicEvent | null> {
  const [events, featured] = await Promise.all([
    getPublicEvents(),
    apiFetch<{ data: { eventId: string | null } }>('/content/featured')
      .then((r) => r.data)
      .catch(() => ({ eventId: null })),
  ]);

  // Choix admin prioritaire (s'il existe encore).
  if (featured.eventId) {
    const chosen = events.find((e) => e.id === featured.eventId);
    if (chosen) return chosen;
  }

  // Repli : dernier publié, de préférence avec des billets.
  const withTickets = events.filter((e) => e.ticketTypes.length > 0);
  const pool = withTickets.length > 0 ? withTickets : events;
  return (
    [...pool].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0] ??
    null
  );
}

export function useFeaturedEventSlug(): string | null {
  const [slug, setSlug] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    getFeaturedEvent()
      .then((e) => {
        if (active && e) setSlug(e.slug);
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
