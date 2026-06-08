'use client';

/**
 * Admin — Modifier un événement.
 * Charge l'événement via GET /api/events puis pré-remplit le formulaire (mode édition).
 */
import { use, useEffect, useState } from 'react';

import { PageHeader } from '@/components/admin/PageHeader';
import { EventForm, type EventFormInitial } from '@/components/admin/EventForm';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { apiAuth } from '@/lib/api';

interface AdminEvent extends EventFormInitial {
  id: string;
}

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<AdminEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    apiAuth<{ data: AdminEvent[] }>('/events')
      .then((res) => {
        if (!active) return;
        const found = res.data.find((e) => e.id === id) ?? null;
        if (!found) setError('Événement introuvable.');
        setEvent(found);
      })
      .catch(() => active && setError("Impossible de charger l'événement."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <>
      <PageHeader
        title="Modifier l'événement"
        subtitle="Mettez à jour les informations ci-dessous"
        backHref="/admin/evenements"
      />

      <section className="mt-6 max-w-4xl rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        {loading ? (
          <LoadingSpinner label="Chargement de l'événement…" />
        ) : error ? (
          <p role="alert" className="text-sm text-semantic-error">
            {error}
          </p>
        ) : event ? (
          <EventForm eventId={event.id} initial={event} />
        ) : null}
      </section>
    </>
  );
}
