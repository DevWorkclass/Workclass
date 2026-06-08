'use client';

/**
 * Page publique — liste de TOUS les événements publiés.
 *  - GET /api/public/events (non sensible)
 */
import { useEffect, useState } from 'react';

import { PublicEventCard } from '@/components/sections/PublicEventCard';
import { apiFetch } from '@/lib/api';
import type { PublicEvent } from '@/lib/public-event';

export default function EventsListPage() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ data: PublicEvent[] }>('/public/events')
      .then((res) => setEvents(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="bg-brand-cream py-16">
      <div className="container">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-brand-gold">
          Nos événements
        </p>
        <h1 className="max-w-2xl text-3xl font-extrabold text-brand-navy sm:text-4xl">
          Tous les événements <span className="text-brand-gold">Work Class</span>
        </h1>

        {loading ? (
          <p className="mt-10 text-sm text-brand-muted">Chargement des événements…</p>
        ) : events.length === 0 ? (
          <p className="mt-10 text-sm text-brand-muted">
            Aucun événement publié pour le moment. Revenez bientôt !
          </p>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => (
              <PublicEventCard key={ev.id} event={ev} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
