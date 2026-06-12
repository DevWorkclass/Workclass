'use client';

/**
 * Hero d'accueil branché sur l'événement « à la une » (choisi en admin,
 * sinon dernier publié). Repli sur MOCK_EVENT tant qu'aucun n'est disponible.
 */
import { useEffect, useState } from 'react';

import { HeroSection } from '@/domains/public/event/components/HeroSection';
import type { Event } from '@/domains/public/event/types/event.types';
import { getFeaturedEvent } from '@/lib/use-featured-event';
import { MOCK_EVENT } from '@/data/mockData';

export function HeroDynamic() {
  const [event, setEvent] = useState<Event>(MOCK_EVENT);

  useEffect(() => {
    getFeaturedEvent()
      .then((featured) => {
        if (!featured) return;
        setEvent({
          ...MOCK_EVENT,
          id: featured.id,
          title: featured.title,
          slug: featured.slug,
          description: featured.description,
          location: featured.location,
          startDate: new Date(featured.startDate),
          endDate: new Date(featured.endDate),
          coverImage: featured.coverImage ?? undefined,
        });
      })
      .catch(() => {
        /* repli statique conservé */
      });
  }, []);

  return <HeroSection event={event} />;
}
