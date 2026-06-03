/**
 * Bloc détail événement — visuel + infos clés + CTA.
 */
import { CalendarDays, MapPin, Users } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { formatDateRange } from '@/lib/formatters';
import type { Event } from '@/domains/public/event/types/event.types';

interface EventDetailSectionProps {
  event: Event;
  capacity?: number;
}

export function EventDetailSection({ event, capacity = 500 }: EventDetailSectionProps) {
  const meta = [
    { icon: CalendarDays, label: formatDateRange(event.startDate, event.endDate) },
    { icon: MapPin, label: event.location },
    { icon: Users, label: `${capacity} places disponibles` },
  ];

  return (
    <section id="evenement" className="container py-16">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        {/* Visuel */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-brand-navy/80">
          {/* TODO: image event.coverImage */}
          <span className="absolute bottom-4 left-4 rounded-xl bg-brand-gold px-4 py-2 text-sm font-bold text-brand-navy">
            {capacity} places
          </span>
        </div>

        {/* Infos */}
        <div>
          <div className="flex flex-wrap gap-2">
            {['Édition 2026', 'Leadership', 'Networking', 'Certification'].map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-brand-navy/5 px-3 py-1 text-xs font-medium text-brand-navy"
              >
                {tag}
              </span>
            ))}
          </div>

          <h2 className="mt-4 text-3xl font-extrabold text-brand-navy">
            {event.title.replace('Gabon', '')}
            <span className="text-brand-gold">Summit</span>
          </h2>
          <p className="mt-4 text-brand-muted">{event.description}</p>

          <ul className="mt-6 space-y-3">
            {meta.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-brand-navy">
                <Icon className="size-5 text-brand-gold" />
                <span className="text-sm">{label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="gold">
              <Link href="/reservation">Réserver ma place</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="#chronogramme">Programme complet</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
