'use client';

/**
 * Sections « événement vedette » de l'accueil (détail + intervenants) branchées
 * sur le dernier événement publié réel. Repli sur les données statiques sinon.
 */
import { useEffect, useState } from 'react';

import { EventDetailSection } from '@/components/sections/EventDetailSection';
import { SpeakersSection } from '@/components/sections/SpeakersSection';
import { getPublicEvents } from '@/lib/events-cache';
import type { Event } from '@/domains/public/event/types/event.types';
import { MOCK_EVENT } from '@/data/mockData';

export function FeaturedSections() {
  const [event, setEvent] = useState<Event>(MOCK_EVENT);
  const [speakers, setSpeakers] = useState<{ name: string; role?: string }[] | undefined>(undefined);
  const [capacity, setCapacity] = useState<number | undefined>(undefined);

  useEffect(() => {
    getPublicEvents()
      .then((data) => {
        const latest = [...data].sort(
          (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
        )[0];
        if (!latest) return;
        setEvent({
          ...MOCK_EVENT,
          id: latest.id,
          title: latest.title,
          description: latest.description,
          location: latest.location,
          startDate: new Date(latest.startDate),
          endDate: new Date(latest.endDate),
        });
        if (Array.isArray(latest.speakers) && latest.speakers.length > 0) {
          setSpeakers(latest.speakers);
        }
        if (latest.seatsTotal > 0) setCapacity(latest.seatsTotal);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <EventDetailSection event={event} {...(capacity ? { capacity } : {})} />
      <SpeakersSection speakers={speakers} />
    </>
  );
}
