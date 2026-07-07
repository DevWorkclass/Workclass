'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileText, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { apiFetch, apiUpload } from '@/lib/api';

/** Convertit une date ISO en valeur d'input `datetime-local` (YYYY-MM-DDTHH:mm). */
function toLocalInput(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const programItem = z.object({
  time: z.string().max(40).optional().or(z.literal('')),
  title: z.string().min(1, 'Intitulé requis').max(200),
  description: z.string().max(500).optional().or(z.literal('')),
});

const speakerItem = z.object({
  name: z.string().min(1, 'Nom requis').max(120),
  role: z.string().max(120).optional().or(z.literal('')),
});

const ticketTypeItem = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Nom requis').max(80),
  description: z.string().max(200).optional().or(z.literal('')),
  price: z.coerce.number().min(0, 'Prix invalide'),
  quota: z.coerce.number().int().min(1, 'Au moins une place'),
});

const eventSchema = z.object({
  title: z.string().min(3, 'Le titre doit faire au moins 3 caractères'),
  description: z.string().min(10, 'La description doit faire au moins 10 caractères'),
  location: z.string().min(3, 'Le lieu doit faire au moins 3 caractères'),
  startDate: z.string().min(1, 'La date de début est requise'),
  endDate: z.string().min(1, 'La date de fin est requise'),
  coverImage: z.string().url('URL invalide').optional().or(z.literal('')),
  recommendations: z.string().max(2000, 'Recommandations trop longues').optional().or(z.literal('')),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  program: z.array(programItem),
  speakers: z.array(speakerItem),
  ticketTypes: z.array(ticketTypeItem).min(1, 'Au moins un type de billet'),
});

type EventFormValues = z.input<typeof eventSchema>;

export interface EventFormInitial {
  title?: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  coverImage?: string;
  recommendations?: string;
  resourceBookletUrl?: string;
  status?: 'draft' | 'published' | 'archived';
  program?: { time?: string; title: string; description?: string }[];
  speakers?: { name: string; role?: string }[];
  ticketTypes?: { id?: string; name: string; description?: string; price: number | string; quota: number }[];
}

interface EventFormProps {
  eventId?: string;
  initial?: EventFormInitial;
}

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold';
const labelClass = 'block text-sm font-semibold text-brand-navy';

export function EventForm({ eventId, initial }: EventFormProps = {}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [coverMode, setCoverMode] = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState(false);
  const [bookletUrl, setBookletUrl] = useState<string>(initial?.resourceBookletUrl ?? '');
  const [bookletBusy, setBookletBusy] = useState(false);
  const [bookletError, setBookletError] = useState<string | null>(null);
  const [confirmRemoveBooklet, setConfirmRemoveBooklet] = useState(false);
  const isEdit = Boolean(eventId);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
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
      program: initial?.program ?? [],
      speakers: initial?.speakers ?? [],
      ticketTypes:
        initial?.ticketTypes?.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description ?? '',
          price: Number(t.price),
          quota: t.quota,
        })) ??
        [
          { name: 'Standard', description: '', price: 0, quota: 100 },
          { name: 'VIP Premium', description: '', price: 0, quota: 50 },
        ],
    },
  });

  const program = useFieldArray({ control, name: 'program' });
  const speakers = useFieldArray({ control, name: 'speakers' });
  const tickets = useFieldArray({ control, name: 'ticketTypes' });
  const coverImage = watch('coverImage');

  const handleCoverUpload = async (file: File) => {
    try {
      setError(null);
      setUploading(true);
      const form = new FormData();
      form.append('image', file);
      const res = await apiUpload<{ data: { url: string } }>('/admin/content/upload-image', form);
      setValue('coverImage', res.data.url, { shouldValidate: true });
    } catch {
      setError("L'upload de l'image a échoué.");
    } finally {
      setUploading(false);
    }
  };

  const handleBookletUpload = async (file: File) => {
    if (!eventId) return;
    if (file.type !== 'application/pdf') {
      setBookletError('Le livret doit être un fichier PDF.');
      return;
    }
    try {
      setBookletError(null);
      setBookletBusy(true);
      const form = new FormData();
      form.append('booklet', file);
      form.append('eventId', eventId);
      const res = await apiUpload<{ data: { resourceBookletUrl: string | null } }>(
        '/admin/events/booklet',
        form,
      );
      setBookletUrl(res.data.resourceBookletUrl ?? '');
    } catch {
      setBookletError("L'upload du livret a échoué.");
    } finally {
      setBookletBusy(false);
    }
  };

  const handleBookletRemove = async () => {
    if (!eventId) return;
    try {
      setBookletError(null);
      setBookletBusy(true);
      await apiFetch('/admin/events/booklet/delete', {
        method: 'POST',
        body: JSON.stringify({ eventId }),
      });
      setBookletUrl('');
    } catch {
      setBookletError("La suppression du livret a échoué.");
    } finally {
      setBookletBusy(false);
    }
  };

  const onSubmit = async (data: EventFormValues) => {
    try {
      setError(null);
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
        await apiFetch('/events', { method: 'POST', body: JSON.stringify(payload) });
      }
      router.push('/admin/evenements');
      router.refresh();
    } catch (err) {
      const e = err as Error;
      setError(e.message || "Une erreur est survenue lors de l'enregistrement de l'événement.");
    }
  };

  let submitLabel = "Créer l'événement";
  if (isSubmitting) submitLabel = 'Enregistrement...';
  else if (isEdit) submitLabel = 'Enregistrer les modifications';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {error && (
        <div className="rounded-md bg-semantic-error/10 p-4 text-sm text-semantic-error">{error}</div>
      )}

      {/* Informations générales */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="title" className={labelClass}>Titre de l&apos;événement *</label>
          <input {...register('title')} id="title" className={inputClass} placeholder="Ex: Work Class Summit 2026" />
          {errors.title && <p className="text-xs text-semantic-error">{errors.title.message}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="description" className={labelClass}>Description *</label>
          <textarea {...register('description')} id="description" rows={4} className={inputClass} />
          {errors.description && <p className="text-xs text-semantic-error">{errors.description.message}</p>}
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="location" className={labelClass}>Lieu *</label>
          <input {...register('location')} id="location" className={inputClass} placeholder="Ex: Palais des Congrès de Libreville" />
          {errors.location && <p className="text-xs text-semantic-error">{errors.location.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="startDate" className={labelClass}>Date et heure de début *</label>
          <input {...register('startDate')} id="startDate" type="datetime-local" className={inputClass} />
          {errors.startDate && <p className="text-xs text-semantic-error">{errors.startDate.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="endDate" className={labelClass}>Date et heure de fin *</label>
          <input {...register('endDate')} id="endDate" type="datetime-local" className={inputClass} />
          {errors.endDate && <p className="text-xs text-semantic-error">{errors.endDate.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className={labelClass}>Statut</label>
          <select {...register('status')} id="status" className={inputClass}>
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
            <option value="archived">Archivé</option>
          </select>
        </div>
      </div>

      {/* Image de couverture (URL ou upload) */}
      <fieldset className="space-y-3 rounded-xl border border-black/5 bg-brand-cream/40 p-4">
        <legend className="px-1 text-sm font-semibold text-brand-navy">Image de couverture</legend>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant={coverMode === 'url' ? 'gold' : 'outline'} onClick={() => setCoverMode('url')}>
            Via URL
          </Button>
          <Button type="button" size="sm" variant={coverMode === 'upload' ? 'gold' : 'outline'} onClick={() => setCoverMode('upload')}>
            Téléverser
          </Button>
        </div>
        {coverMode === 'url' ? (
          <input {...register('coverImage')} type="url" className={inputClass} placeholder="https://..." />
        ) : (
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            aria-label="Téléverser l'image de couverture"
            className="text-sm"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleCoverUpload(f);
            }}
          />
        )}
        {uploading && <p className="text-xs text-brand-muted">Envoi en cours…</p>}
        {errors.coverImage && <p className="text-xs text-semantic-error">{errors.coverImage.message}</p>}
        {coverImage ? (
          <div
            className="mt-2 aspect-[16/7] w-full max-w-md rounded-lg border border-black/10 bg-cover bg-center"
            style={{ backgroundImage: `url(${coverImage})` }}
            role="img"
            aria-label="Aperçu de la couverture"
          />
        ) : null}
      </fieldset>

      {/* Types de billets (tarification + nombre de places) */}
      <fieldset className="space-y-3 rounded-xl border border-black/5 p-4">
        <legend className="px-1 text-sm font-semibold text-brand-navy">Types de billets (tarif + places) *</legend>
        {tickets.fields.map((field, i) => (
          <div key={field.id} className="grid gap-2 rounded-lg bg-brand-cream/40 p-3 sm:grid-cols-[1fr_1fr_110px_100px_auto]">
            <input {...register(`ticketTypes.${i}.name`)} className={inputClass} placeholder="Nom (ex: Standard)" />
            <input {...register(`ticketTypes.${i}.description`)} className={inputClass} placeholder="Description (option)" />
            <input {...register(`ticketTypes.${i}.price`)} type="number" min={0} step="100" className={inputClass} placeholder="Prix" />
            <input {...register(`ticketTypes.${i}.quota`)} type="number" min={1} className={inputClass} placeholder="Places" />
            <Button type="button" variant="ghost" size="sm" className="text-semantic-error" onClick={() => tickets.remove(i)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        {errors.ticketTypes && (
          <p className="text-xs text-semantic-error">
            {errors.ticketTypes.message ?? 'Vérifiez les types de billets (nom, prix, places).'}
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => tickets.append({ name: '', description: '', price: 0, quota: 1 })}
        >
          <Plus className="mr-1 size-4" /> Ajouter un type de billet
        </Button>
      </fieldset>

      {/* Programme */}
      <fieldset className="space-y-3 rounded-xl border border-black/5 p-4">
        <legend className="px-1 text-sm font-semibold text-brand-navy">Programme</legend>
        {program.fields.map((field, i) => (
          <div key={field.id} className="grid gap-2 rounded-lg bg-brand-cream/40 p-3 sm:grid-cols-[120px_1fr_1fr_auto]">
            <input {...register(`program.${i}.time`)} className={inputClass} placeholder="09h00" />
            <input {...register(`program.${i}.title`)} className={inputClass} placeholder="Intitulé du créneau" />
            <input {...register(`program.${i}.description`)} className={inputClass} placeholder="Détail (option)" />
            <Button type="button" variant="ghost" size="sm" className="text-semantic-error" onClick={() => program.remove(i)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => program.append({ time: '', title: '', description: '' })}>
          <Plus className="mr-1 size-4" /> Ajouter un créneau
        </Button>
      </fieldset>

      {/* Intervenants */}
      <fieldset className="space-y-3 rounded-xl border border-black/5 p-4">
        <legend className="px-1 text-sm font-semibold text-brand-navy">Intervenants</legend>
        {speakers.fields.map((field, i) => (
          <div key={field.id} className="grid gap-2 rounded-lg bg-brand-cream/40 p-3 sm:grid-cols-[1fr_1fr_auto]">
            <input {...register(`speakers.${i}.name`)} className={inputClass} placeholder="Nom de l'intervenant" />
            <input {...register(`speakers.${i}.role`)} className={inputClass} placeholder="Rôle / profession" />
            <Button type="button" variant="ghost" size="sm" className="text-semantic-error" onClick={() => speakers.remove(i)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => speakers.append({ name: '', role: '' })}>
          <Plus className="mr-1 size-4" /> Ajouter un intervenant
        </Button>
      </fieldset>

      {/* Recommandations */}
      <div className="space-y-2">
        <label htmlFor="recommendations" className={labelClass}>Recommandations (propre à l&apos;événement)</label>
        <textarea
          {...register('recommendations')}
          id="recommendations"
          rows={3}
          className={inputClass}
          placeholder="Ex: tenue correcte exigée, arriver 30 min avant, pièce d'identité…"
        />
        {errors.recommendations && <p className="text-xs text-semantic-error">{errors.recommendations.message}</p>}
      </div>

      {/* Livret ressources (PDF) — disponible uniquement en édition (besoin de l'ID). */}
      {isEdit ? (
        <div className="space-y-2 rounded-xl border border-black/10 bg-brand-cream/40 p-4">
          <label className={labelClass}>Livret ressources (PDF)</label>
          <p className="text-xs text-brand-muted">
            Le lien de téléchargement sera envoyé au participant en même temps que son certificat.
            Enregistrez-le avant l&apos;envoi des certificats.
          </p>

          {bookletUrl ? (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href={bookletUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-navy underline"
              >
                <FileText className="size-4" /> Voir le livret enregistré
              </a>
              <label className="cursor-pointer text-sm font-semibold text-brand-navy underline">
                Remplacer
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  disabled={bookletBusy}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleBookletUpload(f);
                    e.target.value = '';
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => setConfirmRemoveBooklet(true)}
                disabled={bookletBusy}
                className="text-sm font-semibold text-semantic-error underline"
              >
                Supprimer
              </button>
            </div>
          ) : (
            <input
              type="file"
              accept="application/pdf"
              disabled={bookletBusy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleBookletUpload(f);
                e.target.value = '';
              }}
              className="block w-full text-sm text-brand-navy file:mr-3 file:rounded-md file:border-0 file:bg-brand-navy file:px-4 file:py-2 file:text-white"
            />
          )}

          {bookletBusy && <p className="text-xs text-brand-muted">Traitement en cours…</p>}
          {bookletError && <p className="text-xs text-semantic-error">{bookletError}</p>}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-black/15 p-4 text-xs text-brand-muted">
          Livret ressources : enregistrez d&apos;abord l&apos;événement pour pouvoir téléverser son PDF.
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.push('/admin/evenements')} disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" variant="gold" disabled={isSubmitting || uploading}>
          {submitLabel}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmRemoveBooklet}
        title="Supprimer le livret ressources ?"
        description="Le livret ne sera plus joint aux prochains envois de certificats. Cette action est irréversible."
        confirmLabel="Supprimer"
        onCancel={() => setConfirmRemoveBooklet(false)}
        onConfirm={() => {
          setConfirmRemoveBooklet(false);
          void handleBookletRemove();
        }}
      />
    </form>
  );
}
