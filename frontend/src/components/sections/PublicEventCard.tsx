/**
 * Carte d'événement publique — couverture, dates, lieu, places disponibles,
 * lien détail + bouton réserver. Réutilisée sur l'accueil et la liste.
 */
import Link from 'next/link';
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { formatEventRange, type PublicEvent } from '@/lib/public-event';

export function PublicEventCard({ event }: Readonly<{ event: PublicEvent }>) {
  const detail = ROUTES.public.eventDetail(event.slug);
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={detail} className="block">
        <div
          className="aspect-[16/9] bg-brand-navy-deep bg-cover bg-center"
          style={event.coverImage ? { backgroundImage: `url(${event.coverImage})` } : undefined}
        />
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold text-brand-navy">
          <Link href={detail} className="hover:text-brand-gold">
            {event.title}
          </Link>
        </h3>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-brand-muted">
          <CalendarDays className="size-4 shrink-0" />
          {formatEventRange(event.startDate, event.endDate)}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-brand-muted">
          <MapPin className="size-4 shrink-0" />
          <span className="truncate">{event.location}</span>
        </p>

        <p className="mt-3 text-sm font-semibold text-brand-navy">
          {event.seatsAvailable > 0 ? (
            <>
              {event.seatsAvailable} place{event.seatsAvailable > 1 ? 's' : ''} disponible
              {event.seatsAvailable > 1 ? 's' : ''}
            </>
          ) : (
            <span className="text-semantic-error">Complet</span>
          )}
        </p>
        {event.seatsPending > 0 && (
          <p className="text-[11px] text-brand-muted">
            +{event.seatsPending} en attente de validation
          </p>
        )}

        <div className="relative z-10 mt-auto flex flex-wrap gap-2 pt-4">
          {event.seatsAvailable > 0 ? (
            <Button asChild variant="gold" size="sm">
              <Link href={`${ROUTES.public.reservation.base}?event=${event.slug}`}>Réserver</Link>
            </Button>
          ) : (
            <Button variant="gold" size="sm" disabled>
              Complet
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href={detail}>
              Détails <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
