'use client';

/**
 * Hero d'accueil branché sur l'événement « à la une ».
 * Reçoit initialEvent du Server Component (page.tsx) → affichage immédiat sans useEffect.
 * Si aucune prop serveur, repli sur fetch client-side puis MOCK_EVENT.
 */
import { useEffect, useState } from 'react';

import { HeroSection } from '@/domains/public/event/components/HeroSection';
import type { Event } from '@/domains/public/event/types/event.types';
import { getFeaturedEvent } from '@/lib/use-featured-event';
import { MOCK_EVENT } from '@/data/mockData';
import type { PublicEvent } from '@/lib/public-event';

function toEvent(src: PublicEvent | null | undefined): Event {
  if (!src) return MOCK_EVENT;
  return {
    ...MOCK_EVENT,
    id: src.id,
    title: src.title,
    slug: src.slug,
    description: src.description,
    location: src.location,
    startDate: new Date(src.startDate),
    endDate: new Date(src.endDate),
    coverImage: src.coverImage ?? undefined,
  };
}

interface Props {
  initialEvent?: PublicEvent | null;
}

export function HeroDynamic({ initialEvent }: Props) {
  const [event, setEvent] = useState<Event>(() => toEvent(initialEvent));

  useEffect(() => {
    // Si le serveur a fourni un vrai événement, pas besoin de re-fetcher
    if (initialEvent) return;
    // Sinon (cold start backend ou prop absente), on tente côté client
    getFeaturedEvent()
      .then((featured) => { if (featured) setEvent(toEvent(featured)); })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <HeroSection event={event} />;
}
