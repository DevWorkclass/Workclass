'use client';

/**
 * Accueil — aperçu des 3 événements publiés les plus récents (dynamique).
 *  - GET /api/public/events
 * Masquée s'il n'y a aucun événement publié.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { PublicEventCard } from '@/components/sections/PublicEventCard';
import { ROUTES } from '@/constants/routes';
import { apiFetch } from '@/lib/api';
import type { PublicEvent } from '@/lib/public-event';

export function EventsPreviewSection() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    apiFetch<{ data: PublicEvent[] }>('/public/events')
      .then((res) => {
        // 3 plus récents (par date de début décroissante).
        const sorted = [...res.data].sort(
          (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
        );
        setEvents(sorted.slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  if (loaded && events.length === 0) return null;

  return (
    <section className="bg-white py-16">
      <div className="container">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-brand-gold">
              Agenda
            </p>
            <h2 className="text-3xl font-extrabold text-brand-navy">
              Nos prochains <span className="text-brand-gold">événements</span>
            </h2>
          </div>
          <Link
            href={ROUTES.public.events}
            className="flex items-center gap-1 text-sm font-semibold text-brand-navy/70 hover:text-brand-navy"
          >
            Voir tous les événements <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => (
            <PublicEventCard key={ev.id} event={ev} />
          ))}
        </div>
      </div>
    </section>
  );
}
