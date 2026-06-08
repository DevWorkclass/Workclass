'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';

/** Convertit une date ISO en valeur d'input `datetime-local` (YYYY-MM-DDTHH:mm). */
function toLocalInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export interface EventFormInitial {
  title?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  coverImage?: string;
  recommendations?: string;
  status?: 'draft' | 'published' | 'archived';
}

const eventSchema = z.object({
  title: z.string().min(3, 'Le titre doit faire au moins 3 caractères'),
  description: z.string().min(10, 'La description doit faire au moins 10 caractères'),
  location: z.string().min(3, 'Le lieu doit faire au moins 3 caractères'),
  startDate: z.string().min(1, 'La date de début est requise'),
  endDate: z.string().min(1, 'La date de fin est requise'),
  coverImage: z.string().url('URL invalide').optional().or(z.literal('')),
  recommendations: z.string().max(2000, 'Recommandations trop longues').optional().or(z.literal('')),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface EventFormProps {
  /** Si fourni : mode édition (POST /admin/events/update), sinon création. */
  eventId?: string;
  initial?: EventFormInitial;
}

export function EventForm({ eventId, initial }: EventFormProps = {}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(eventId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: initial?.title ?? '',
      description: initial?.description ?? '',
      location: initial?.location ?? '',
      startDate: toLocalInput(initial?.startDate),
      endDate: toLocalInput(initial?.endDate),
      coverImage: initial?.coverImage ?? '',
      recommendations: initial?.recommendations ?? '',
      status: initial?.status ?? 'draft',
    },
  });

  const onSubmit = async (data: EventFormValues) => {
    try {
      setError(null);

      // Conversion des dates locales en ISO 8601 pour le backend
      const payload = {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      };

      if (isEdit) {
        await apiFetch('/admin/events/update', {
          method: 'POST',
          body: JSON.stringify({ id: eventId, ...payload }),
        });
      } else {
        await apiFetch('/events', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      router.push('/admin/evenements');
      router.refresh();
    } catch (err) {
      const e = err as Error;
      setError(e.message || "Une erreur est survenue lors de l'enregistrement de l'événement.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-md bg-semantic-error/10 p-4 text-sm text-semantic-error">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="title" className="block text-sm font-semibold text-brand-navy">
            Titre de l&apos;événement *
          </label>
          <input
            {...register('title')}
            id="title"
            type="text"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
            placeholder="Ex: Work Class Summit 2026"
          />
          {errors.title && <p className="text-xs text-semantic-error">{errors.title.message}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="description" className="block text-sm font-semibold text-brand-navy">
            Description *
          </label>
          <textarea
            {...register('description')}
            id="description"
            rows={4}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
            placeholder="Description complète de l'événement..."
          />
          {errors.description && <p className="text-xs text-semantic-error">{errors.description.message}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="location" className="block text-sm font-semibold text-brand-navy">
            Lieu *
          </label>
          <input
            {...register('location')}
            id="location"
            type="text"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
            placeholder="Ex: Palais des Congrès de Libreville"
          />
          {errors.location && <p className="text-xs text-semantic-error">{errors.location.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="startDate" className="block text-sm font-semibold text-brand-navy">
            Date et heure de début *
          </label>
          <input
            {...register('startDate')}
            id="startDate"
            type="datetime-local"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
          />
          {errors.startDate && <p className="text-xs text-semantic-error">{errors.startDate.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="endDate" className="block text-sm font-semibold text-brand-navy">
            Date et heure de fin *
          </label>
          <input
            {...register('endDate')}
            id="endDate"
            type="datetime-local"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
          />
          {errors.endDate && <p className="text-xs text-semantic-error">{errors.endDate.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className="block text-sm font-semibold text-brand-navy">
            Statut
          </label>
          <select
            {...register('status')}
            id="status"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
          >
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
            <option value="archived">Archivé</option>
          </select>
          {errors.status && <p className="text-xs text-semantic-error">{errors.status.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="coverImage" className="block text-sm font-semibold text-brand-navy">
            URL de l&apos;image de couverture (optionnel)
          </label>
          <input
            {...register('coverImage')}
            id="coverImage"
            type="url"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
            placeholder="https://..."
          />
          {errors.coverImage && <p className="text-xs text-semantic-error">{errors.coverImage.message}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="recommendations" className="block text-sm font-semibold text-brand-navy">
            Recommandations (propre à l&apos;événement)
          </label>
          <textarea
            {...register('recommendations')}
            id="recommendations"
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
            placeholder="Ex: tenue correcte exigée, arriver 30 min avant, apporter une pièce d'identité..."
          />
          {errors.recommendations && (
            <p className="text-xs text-semantic-error">{errors.recommendations.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/evenements')}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button type="submit" variant="gold" disabled={isSubmitting}>
          {isSubmitting
            ? 'Enregistrement...'
            : isEdit
              ? 'Enregistrer les modifications'
              : "Créer l'événement"}
        </Button>
      </div>
    </form>
  );
}
