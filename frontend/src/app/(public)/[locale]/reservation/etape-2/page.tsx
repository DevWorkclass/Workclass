'use client';

/**
 * Réservation — Étape 2/3 : informations du participant.
 * Lit le brouillon (étape 1), collecte le participant, puis passe à l'étape 3.
 */
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/formatters';
import { getDraft, patchDraft, type ReservationDraft } from '@/lib/reservation-draft';

const schema = z.object({
  firstName: z.string().min(2, 'Prénom requis'),
  lastName: z.string().min(2, 'Nom requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().regex(/^\+?\d{8,15}$/, 'Téléphone invalide (8 à 15 chiffres)'),
  company: z.string().max(120).optional().or(z.literal('')),
  position: z.string().max(120).optional().or(z.literal('')),
  consent: z.literal(true, { errorMap: () => ({ message: 'Consentement requis' }) }),
});

type FormValues = z.infer<typeof schema>;

const STEPS = ['Type de billet', 'Vos informations', 'Paiement'] as const;
const inputClass =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold';

export default function ReservationEtape2Page() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'fr';
  const [draft, setDraftState] = useState<ReservationDraft | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const d = getDraft();
    if (!d) {
      router.replace(`/${locale}/reservation/etape-1`);
      return;
    }
    setDraftState(d);
    if (d.participant) reset({ ...d.participant, consent: true });
  }, [locale, router, reset]);

  const onSubmit = (data: FormValues) => {
    patchDraft({
      participant: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        company: data.company || undefined,
        position: data.position || undefined,
      },
    });
    router.push(`/${locale}/reservation/etape-3`);
  };

  if (!draft) return null;
  const total = draft.unitPrice * draft.quantity;

  return (
    <main className="bg-brand-cream py-10 lg:py-14">
      <div className="container">
        <header className="mb-8">
          <button
            type="button"
            onClick={() => router.push(`/${locale}/reservation/etape-1`)}
            className="mb-5 flex w-fit items-center gap-1.5 text-sm font-medium text-brand-navy/60 transition-colors hover:text-brand-navy"
          >
            <ArrowLeft className="size-4" />
            Retour
          </button>
          <h1 className="text-3xl font-extrabold text-brand-navy lg:text-4xl">Vos informations</h1>
        </header>

        <ol className="mb-8 grid grid-cols-1 gap-2 rounded-full bg-white p-2 shadow-sm sm:grid-cols-3">
          {STEPS.map((label, index) => (
            <li
              key={label}
              aria-current={index === 1 ? 'step' : undefined}
              className={`flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold ${
                index === 1 ? 'bg-brand-navy text-white' : 'text-brand-muted'
              }`}
            >
              {index + 1} · {label}
            </li>
          ))}
        </ol>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 rounded-2xl border border-black/5 bg-white p-6 shadow-sm lg:p-8"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-brand-navy">Prénom *</span>
                <input {...register('firstName')} className={`mt-1 ${inputClass}`} />
                {errors.firstName && <p className="mt-1 text-xs text-semantic-error">{errors.firstName.message}</p>}
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-brand-navy">Nom *</span>
                <input {...register('lastName')} className={`mt-1 ${inputClass}`} />
                {errors.lastName && <p className="mt-1 text-xs text-semantic-error">{errors.lastName.message}</p>}
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-semibold text-brand-navy">Email *</span>
              <input {...register('email')} type="email" className={`mt-1 ${inputClass}`} />
              {errors.email && <p className="mt-1 text-xs text-semantic-error">{errors.email.message}</p>}
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-brand-navy">Téléphone *</span>
              <input {...register('phone')} type="tel" placeholder="+241…" className={`mt-1 ${inputClass}`} />
              {errors.phone && <p className="mt-1 text-xs text-semantic-error">{errors.phone.message}</p>}
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-brand-navy">Entreprise</span>
                <input {...register('company')} className={`mt-1 ${inputClass}`} />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-brand-navy">Fonction</span>
                <input {...register('position')} className={`mt-1 ${inputClass}`} />
              </label>
            </div>
            <label className="flex items-start gap-2.5 pt-1">
              <input {...register('consent')} type="checkbox" className="mt-0.5 size-4 shrink-0" />
              <span className="text-sm text-brand-muted">
                J&apos;accepte que mes données soient utilisées pour la gestion de ma réservation.
              </span>
            </label>
            {errors.consent && <p className="text-xs text-semantic-error">{errors.consent.message}</p>}

            <Button type="submit" variant="gold" size="lg" className="w-full">
              Continuer vers le paiement
            </Button>
          </form>

          <aside className="h-fit rounded-2xl bg-[linear-gradient(160deg,#0E2450_5%,#2152B6_95%)] p-5 text-white shadow-lg">
            <h2 className="text-lg font-bold">{draft.eventTitle}</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-white/60">Billet</dt>
                <dd className="font-semibold">{draft.ticketName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/60">Quantité</dt>
                <dd className="font-semibold">{draft.quantity}</dd>
              </div>
            </dl>
            <div className="mt-5 flex items-baseline justify-between border-t border-white/15 pt-4">
              <span className="text-lg font-bold">Total</span>
              <span className="text-2xl font-extrabold">{formatPrice(total, draft.currency)}</span>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
