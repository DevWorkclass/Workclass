'use client';

/**
 * Réservation — Étape 1/3 : type de billet.
 * Charge le dernier événement publié + ses types de billets (GET /public/events).
 * Repli sur les données mock si aucun événement publié (démo).
 */
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { MOCK_EVENT, MOCK_TICKET_TYPES } from '@/data/mockData';
import { ReservationStep1 } from '@/domains/public/booking/components/ReservationStep1';
import type { Event } from '@/domains/public/event/types/event.types';
import type { TicketType } from '@/domains/public/booking/types/booking.types';
import { getPublicEvents } from '@/lib/events-cache';

export default function ReservationEtape1Page() {
  return (
    <Suspense fallback={null}>
      <ReservationStep1Loader />
    </Suspense>
  );
}

function ReservationStep1Loader() {
  const searchParams = useSearchParams();
  const eventSlug = searchParams?.get('event') ?? null;
  const [event, setEvent] = useState<Event>(MOCK_EVENT);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>(MOCK_TICKET_TYPES);

  useEffect(() => {
    getPublicEvents()
      .then((data) => {
        // Événement ciblé par `?event=slug` (chaque événement a ses propres
        // billets/prix) ; à défaut, le dernier événement publié.
        const byDate = [...data].sort(
          (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
        );
        const latest = (eventSlug && byDate.find((e) => e.slug === eventSlug)) || byDate[0];
        if (!latest || latest.ticketTypes.length === 0) return;
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
        setTicketTypes(
          latest.ticketTypes.map((t) => ({
            id: t.id,
            name: t.name,
            price: Number(t.price),
            currency: 'FCFA',
            features: t.description ? [t.description] : [],
          })),
        );
      })
      .catch(() => {
        /* repli mock conservé */
      });
  }, [eventSlug]);

  return <ReservationStep1 event={event} ticketTypes={ticketTypes} />;
}
