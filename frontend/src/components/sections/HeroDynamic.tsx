'use client';

/**
 * Hero d'accueil branché sur le dernier événement publié (réel).
 *  - GET /api/public/events → événement publié le plus récent (par date de début).
 * Repli sur l'événement vedette statique (MOCK_EVENT) tant qu'aucun n'est publié.
 */
import { useEffect, useState } from 'react';

import { HeroSection } from '@/domains/public/event/components/HeroSection';
import type { Event } from '@/domains/public/event/types/event.types';
import { getPublicEvents } from '@/lib/events-cache';
import { MOCK_EVENT } from '@/data/mockData';

export function HeroDynamic() {
  const [event, setEvent] = useState<Event>(MOCK_EVENT);

  useEffect(() => {
    getPublicEvents()
      .then((data) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const latest = [...data].sort(
          (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
        )[0];
        if (!latest) return;
        setEvent({
          ...MOCK_EVENT,
          id: latest.id,
          title: latest.title,
          slug: latest.slug,
          description: latest.description,
          location: latest.location,
          startDate: new Date(latest.startDate),
          endDate: new Date(latest.endDate),
          coverImage: latest.coverImage ?? undefined,
        });
      })
      .catch(() => {
        /* repli statique conservé */
      });
  }, []);

  return <HeroSection event={event} />;
}
