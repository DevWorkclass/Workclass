'use client';

/**
 * Hero d'accueil branché sur le dernier événement publié (réel).
 *  - GET /api/public/events → événement publié le plus récent (par date de début).
 * Repli sur l'événement vedette statique (MOCK_EVENT) tant qu'aucun n'est publié.
 */
import { useEffect, useState } from 'react';

import { HeroSection } from '@/domains/public/event/components/HeroSection';
import type { Event } from '@/domains/public/event/types/event.types';
import { apiFetch } from '@/lib/api';
import type { PublicEvent } from '@/lib/public-event';
import { MOCK_EVENT } from '@/data/mockData';

export function HeroDynamic() {
  const [event, setEvent] = useState<Event>(MOCK_EVENT);

  useEffect(() => {
    apiFetch<{ data: PublicEvent[] }>('/public/events')
      .then((res) => {
        if (!Array.isArray(res.data) || res.data.length === 0) return;
        const latest = [...res.data].sort(
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
