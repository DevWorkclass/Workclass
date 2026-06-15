'use client';

/**
 * Page publique — détail d'un événement (programme, intervenants, recommandations,
 * billets) avec bouton de réservation toujours accessible.
 *  - GET /api/public/events (filtré par slug côté client)
 */
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, CheckCircle2, MapPin, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { formatEventRange, type PublicEvent } from '@/lib/public-event';
import { formatPrice } from '@/lib/formatters';

export default function EventDetailPage({ params }: Readonly<{ params: Promise<{ locale: string; slug: string }> }>) {
  const { locale, slug } = use(params);
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'notfound'>('loading');

  useEffect(() => {
    apiFetch<{ data: PublicEvent[] }>('/public/events')
      .then((res) => {
        const found = res.data.find((e) => e.slug === slug) ?? null;
        setEvent(found);
        setStatus(found ? 'ready' : 'notfound');
      })
      .catch(() => setStatus('notfound'));
  }, [slug]);

  if (status === 'loading') {
    return <p className="container py-20 text-center text-brand-muted">Chargement…</p>;
  }

  if (status === 'notfound' || !event) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold text-brand-navy">Événement introuvable</h1>
        <Link href={`/${locale}/evenements`} className="mt-4 inline-block text-brand-gold hover:underline">
          ← Voir tous les événements
        </Link>
      </div>
    );
  }

  const reserveHref = `/${locale}/reservation?event=${event.slug}`;

  const reserveBtn =
    event.seatsAvailable > 0 ? (
      <Button asChild variant="gold" size="lg" className="w-full">
        <Link href={reserveHref}>Réserver ma place</Link>
      </Button>
    ) : (
      <Button variant="gold" size="lg" className="w-full" disabled>
        Complet
      </Button>
    );

  return (
    <>
      {/* Barre de retour */}
      <div className="border-b border-black/5 bg-white">
        <div className="container py-3">
          <Link
            href={`/${locale}/evenements`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-navy/60 transition-colors hover:text-brand-navy"
          >
            <ArrowLeft className="size-4" />
            Tous les événements
          </Link>
        </div>
      </div>

      {/* Hero couverture */}
      <div
        className="relative flex min-h-[300px] items-end bg-brand-navy-deep bg-cover bg-center"
        style={event.coverImage ? { backgroundImage: `url(${event.coverImage})` } : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
        <div className="container relative py-8 text-white">
          <h1 className="max-w-3xl text-3xl font-extrabold sm:text-4xl">{event.title}</h1>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/85">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" /> {formatEventRange(event.startDate, event.endDate)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" /> {event.location}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="size-4" />
              {event.seatsAvailable > 0 ? `${event.seatsAvailable} places restantes` : 'Complet'}
            </span>
          </div>
        </div>
      </div>

      <div className="container grid gap-10 py-12 lg:grid-cols-[1fr_320px]">
        {/* Contenu principal */}
        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-bold text-brand-navy">À propos</h2>
            <p className="mt-3 whitespace-pre-line text-brand-muted">{event.description}</p>
          </section>

          {event.program.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-brand-navy">Programme</h2>
              <ul className="mt-4 space-y-3">
                {event.program.map((p, i) => (
                  <li key={i} className="flex gap-4 rounded-xl border border-black/5 bg-white p-4 shadow-sm">
                    {p.time && (
                      <span className="shrink-0 font-bold text-brand-gold">{p.time}</span>
                    )}
                    <div>
                      <p className="font-semibold text-brand-navy">{p.title}</p>
                      {p.description && <p className="text-sm text-brand-muted">{p.description}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {event.speakers.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-brand-navy">Intervenants</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {event.speakers.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-black/5 bg-white p-4 shadow-sm">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-gold/15 font-bold text-brand-gold">
                      {s.name.charAt(0)}
                    </span>
                    <div>
                      <p className="font-semibold text-brand-navy">{s.name}</p>
                      {s.role && <p className="text-sm text-brand-muted">{s.role}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {event.recommendations && (
            <section>
              <h2 className="text-xl font-bold text-brand-navy">Recommandations</h2>
              <div className="mt-4 rounded-2xl border border-brand-gold/30 bg-brand-gold/5 p-5">
                <ul className="space-y-2.5">
                  {event.recommendations
                    .split('\n')
                    .map((l) => l.trim())
                    .filter(Boolean)
                    .map((line, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-brand-navy/85">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand-gold" aria-hidden />
                        <span>{line.replace(/^[-•*]\s*/, '')}</span>
                      </li>
                    ))}
                </ul>
              </div>
            </section>
          )}

          {/* Bouton réserver visible sur mobile (avant l'aside) */}
          <div className="lg:hidden">
            {reserveBtn}
          </div>
        </div>

        {/* Encart billets + réservation (sticky desktop) */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-brand-navy">Billets</h2>
            <ul className="mt-4 space-y-3">
              {event.ticketTypes.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 border-b border-black/5 pb-3 last:border-0">
                  <div>
                    <p className="font-semibold text-brand-navy">{t.name}</p>
                    {t.description && <p className="text-xs text-brand-muted">{t.description}</p>}
                  </div>
                  <span className="shrink-0 font-bold text-brand-gold">{formatPrice(Number(t.price))}</span>
                </li>
              ))}
            </ul>
            <div className="mt-5">{reserveBtn}</div>
          </div>
        </aside>
      </div>
    </>
  );
}
