'use client';

/**
 * Réservation — Étape 1/3 : type de billet.
 * Charge le dernier événement publié + ses types de billets (GET /public/events).
 * Repli sur les données mock si aucun événement publié (démo).
 */
import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { MOCK_EVENT, MOCK_TICKET_TYPES } from '@/data/mockData';
import { ReservationStep1 } from '@/domains/public/booking/components/ReservationStep1';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { Event } from '@/domains/public/event/types/event.types';
import type { TicketType } from '@/domains/public/booking/types/booking.types';
import { getPublicEvents } from '@/lib/events-cache';
import type { PublicEvent } from '@/lib/public-event';

export default function ReservationEtape1Page() {
  return (
    <Suspense fallback={null}>
      <ReservationStep1Loader />
    </Suspense>
  );
}

function ReservationStep1Loader() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'fr';
  const eventSlug = searchParams?.get('event') ?? null;

  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const apply = (ev: PublicEvent) => {
      setEvent({
        ...MOCK_EVENT,
        id: ev.id,
        title: ev.title,
        slug: ev.slug,
        description: ev.description,
        location: ev.location,
        startDate: new Date(ev.startDate),
        endDate: new Date(ev.endDate),
        coverImage: ev.coverImage ?? undefined,
      });
      setTicketTypes(
        ev.ticketTypes.map((t) => ({
          id: t.id,
          name: t.name,
          price: Number(t.price),
          currency: 'FCFA',
          features: t.description ? [t.description] : [],
        })),
      );
      setLoading(false);
    };

    getPublicEvents()
      .then((data) => {
        if (!active) return;
        const withTickets = data.filter((e) => e.ticketTypes.length > 0);

        // 1) Événement explicitement ciblé (chaque événement = ses propres prix).
        if (eventSlug) {
          const target = withTickets.find((e) => e.slug === eventSlug);
          if (target) return apply(target);
          // Slug inconnu/sans billets → on force le choix d'un événement.
          router.replace(`/${locale}/evenements`);
          return;
        }

        // 2) Aucun événement ciblé : un seul → on l'utilise ; plusieurs → choix obligatoire.
        if (withTickets.length === 1 && withTickets[0]) return apply(withTickets[0]);
        if (withTickets.length > 1) {
          router.replace(`/${locale}/evenements`);
          return;
        }

        // 3) Aucun événement réservable : démo (mock) pour éviter une page vide.
        setEvent(MOCK_EVENT);
        setTicketTypes(MOCK_TICKET_TYPES);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setEvent(MOCK_EVENT);
        setTicketTypes(MOCK_TICKET_TYPES);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [eventSlug, locale, router]);

  if (loading || !event) {
    return (
      <main className="grid min-h-[50vh] place-items-center bg-brand-cream">
        <LoadingSpinner label="Chargement de la réservation…" />
      </main>
    );
  }

  return <ReservationStep1 event={event} ticketTypes={ticketTypes} />;
}
