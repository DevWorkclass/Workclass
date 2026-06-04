'use client';

/**
 * Vue billet participant — récapitulatif + aperçu du pass.
 * Données passées en props (mock local pour l'instant ; l'API réelle exposera
 * le billet via POST /api/tickets/get côté backend).
 */
import { CalendarPlus, Download, Mail, MapPin, Minus, Phone, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { formatFullName } from '@/lib/formatters';
import type { Event } from '@/domains/public/event/types/event.types';
import type { Participant } from '@/domains/public/participant/types/participant.types';
import type { Ticket } from '@/domains/admin/tickets/types/tickets.types';

import { QrPlaceholder } from './QrPlaceholder';

interface TicketViewProps {
  event: Event;
  participant: Participant;
  ticket: Ticket;
  locale?: string;
}

const QR_SIZES = [180, 220, 260, 300] as const;
const DEFAULT_QR_INDEX = 1;

/** Construit un lien « Ajouter à Google Agenda » à partir de l'événement. */
function buildCalendarUrl(event: Event): string {
  const toIcs = (d: Date) => `${d.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${toIcs(event.startDate)}/${toIcs(event.endDate)}`,
    location: event.location,
    details: event.description,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function TicketView({ event, participant, ticket, locale = 'fr-FR' }: TicketViewProps) {
  const [qrIndex, setQrIndex] = useState<number>(DEFAULT_QR_INDEX);

  const fullName = formatFullName(participant.firstName, participant.lastName);

  const { dateLabel, timeLabel } = useMemo(() => {
    const dateFmt = new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timeFmt = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit' });
    return {
      dateLabel: dateFmt.format(event.startDate),
      timeLabel: `${timeFmt.format(event.startDate)} – ${timeFmt.format(event.endDate)}`,
    };
  }, [event.startDate, event.endDate, locale]);

  const calendarUrl = useMemo(() => buildCalendarUrl(event), [event]);

  function handleDownload() {
    if (ticket.pdfUrl) {
      window.open(ticket.pdfUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    // Repli sans dépendance : impression navigateur (PDF système).
    window.print();
  }

  const zoomOut = () => setQrIndex((i) => Math.max(0, i - 1));
  const zoomIn = () => setQrIndex((i) => Math.min(QR_SIZES.length - 1, i + 1));

  const infoFields: { label: string; value: string; icon?: typeof Mail }[] = [
    { label: 'Nom complet', value: fullName },
    { label: 'Email', value: participant.email, icon: Mail },
    { label: 'Téléphone', value: participant.phone, icon: Phone },
    { label: 'Entreprise', value: participant.company ?? '—' },
  ];

  const eventFields: { label: string; value: string; icon: typeof MapPin }[] = [
    { label: 'Date', value: dateLabel, icon: CalendarPlus },
    { label: 'Horaires', value: timeLabel, icon: CalendarPlus },
    { label: 'Lieu', value: event.location, icon: MapPin },
    { label: 'Format', value: 'Présentiel', icon: MapPin },
  ];

  return (
    <main className="bg-brand-cream py-10 lg:py-14">
      <div className="container">
        {/* En-tête */}
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-gold">Billet</p>
          <h1 className="mt-2 text-3xl font-extrabold uppercase text-brand-navy lg:text-4xl">
            {event.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-brand-navy px-5 py-2 text-sm font-semibold text-white">
              Espace participant
            </span>
            <span className="text-sm text-brand-muted">
              Billet {ticket.ticketNumber} · {participant.email}
            </span>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          {/* Carte récapitulatif */}
          <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm lg:p-8">
            <h2 className="text-2xl font-bold text-brand-navy">Récapitulatif de votre billet</h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {/* Vos informations */}
              <div className="rounded-2xl border border-brand-gold/40 bg-gradient-to-br from-brand-gold/10 to-white p-5">
                <h3 className="text-lg font-bold text-brand-navy">Vos informations</h3>
                <dl className="mt-4 space-y-4">
                  {infoFields.map(({ label, value, icon: Icon }) => (
                    <div key={label}>
                      <dt className="flex items-center gap-1.5 text-sm text-brand-muted">
                        {Icon ? <Icon className="size-3.5" aria-hidden /> : null}
                        {label}
                      </dt>
                      <dd className="mt-0.5 break-words font-semibold text-brand-navy">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Détails de l'événement */}
              <div className="rounded-2xl border border-black/5 bg-brand-cream p-5">
                <h3 className="text-lg font-bold text-brand-navy">Détails de l&apos;événement</h3>
                <dl className="mt-4 space-y-4">
                  {eventFields.map(({ label, value, icon: Icon }) => (
                    <div key={label}>
                      <dt className="flex items-center gap-1.5 text-sm text-brand-muted">
                        <Icon className="size-3.5 text-brand-gold" aria-hidden />
                        {label}
                      </dt>
                      <dd className="mt-0.5 font-semibold capitalize text-brand-navy">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            {/* Statut */}
            <div className="mt-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-4 py-1.5 text-sm font-semibold text-brand-gold">
                <span className="size-2 rounded-full bg-brand-gold" aria-hidden />
                Billet confirmé
              </span>
            </div>

            {/* QR code */}
            <div className="mt-6 flex flex-col items-center rounded-2xl border border-black/5 bg-brand-cream/60 p-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={zoomOut}
                  disabled={qrIndex === 0}
                  aria-label="Réduire le QR code"
                  className="flex size-10 items-center justify-center rounded-lg border border-black/10 bg-brand-cream text-brand-navy transition-colors hover:bg-brand-gold/15 disabled:opacity-40"
                >
                  <Minus className="size-4" />
                </button>
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  <QrPlaceholder value={ticket.qrCode} size={QR_SIZES[qrIndex]} />
                </div>
                <button
                  type="button"
                  onClick={zoomIn}
                  disabled={qrIndex === QR_SIZES.length - 1}
                  aria-label="Agrandir le QR code"
                  className="flex size-10 items-center justify-center rounded-lg border border-black/10 bg-brand-cream text-brand-navy transition-colors hover:bg-brand-gold/15 disabled:opacity-40"
                >
                  <Plus className="size-4" />
                </button>
              </div>
              <p className="mt-4 text-sm text-brand-muted">Présentez ce billet à l&apos;entrée</p>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button variant="navy" className="flex-1" onClick={handleDownload}>
                <Download className="size-4" />
                Télécharger le billet
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <a href={calendarUrl} target="_blank" rel="noopener noreferrer">
                  <CalendarPlus className="size-4" />
                  Ajouter au calendrier
                </a>
              </Button>
            </div>
          </section>

          {/* Aperçu du pass */}
          <aside className="rounded-2xl bg-[linear-gradient(160deg,#0E2450_7%,#2152B6_74%)] p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
                Pass participant
              </span>
              <span className="font-mono text-xs text-white/60">{ticket.ticketNumber}</span>
            </div>

            <div className="mt-6 flex justify-center rounded-xl bg-white/95 p-4">
              <QrPlaceholder value={ticket.qrCode} size={200} />
            </div>

            <div className="mt-6">
              <p className="text-2xl font-bold">{fullName}</p>
              <p className="text-sm text-white/70">{participant.company ?? participant.email}</p>
            </div>

            <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm">
              <div>
                <p className="text-white/50">Événement</p>
                <p className="font-semibold">{event.title}</p>
              </div>
              <div>
                <p className="text-white/50">Date</p>
                <p className="font-semibold capitalize">{dateLabel}</p>
              </div>
              <div>
                <p className="text-white/50">Lieu</p>
                <p className="font-semibold">{event.location}</p>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-white/50">
              Billet personnel et nominatif — non transférable.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
