'use client';

/**
 * Réservation — Étape 2/3 : informations du payeur + participants.
 * Section A : numéro de téléphone du payeur (obligatoire) + nom (optionnel).
 * Section B : un formulaire par place réservée (prénom + nom obligatoires, email recommandé).
 * Si 1 seule place, le nom du participant est pré-rempli avec le nom du payeur dès que celui-ci est saisi.
 */
import { ArrowLeft, User } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/formatters';
import { getDraft, patchDraft, type ReservationDraft } from '@/lib/reservation-draft';

const participantSchema = z.object({
  firstName: z.string().min(2, 'Prénom requis (2 caractères min.)'),
  lastName: z.string().min(2, 'Nom requis (2 caractères min.)'),
  email: z.string().email('Email invalide').or(z.literal('')).optional(),
});

const schema = z.object({
  payerPhone: z.string().regex(/^\+?\d{8,15}$/, 'Numéro invalide (8 à 15 chiffres, ex: +24177…)'),
  payerName: z.string().max(120).optional(),
  payerAddress: z.string().min(5, 'Adresse requise (au moins 5 caractères)').max(300),
  participants: z.array(participantSchema).min(1),
  consent: z.literal(true, { errorMap: () => ({ message: 'Consentement obligatoire' }) }),
});

type FormValues = z.infer<typeof schema>;

const STEPS = ['Sélection', 'Informations', 'Paiement'] as const;

const inputClass =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2.5 text-sm text-brand-navy placeholder:text-brand-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold';

export default function ReservationEtape2Page() {
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'fr';
  const [draft, setDraftState] = useState<ReservationDraft | null>(null);
  const payerNameRef = useRef<string>('');

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { participants: [{ firstName: '', lastName: '', email: '' }] },
  });

  const { fields } = useFieldArray({ control, name: 'participants' });

  const payerName = watch('payerName');

  // Pré-rempli le participant unique avec le nom du payeur quand il y a 1 seule place
  useEffect(() => {
    if (!draft || draft.quantity !== 1) return;
    if (payerName && payerName !== payerNameRef.current) {
      payerNameRef.current = payerName;
      const parts = payerName.trim().split(/\s+/);
      const first = parts[0] ?? '';
      const last = parts.slice(1).join(' ');
      setValue('participants.0.firstName', first, { shouldValidate: false });
      setValue('participants.0.lastName', last, { shouldValidate: false });
    }
  }, [payerName, draft, setValue]);

  useEffect(() => {
    const d = getDraft();
    if (!d) {
      router.replace(`/${locale}/reservation/etape-1`);
      return;
    }
    setDraftState(d);

    // Construit le tableau de participants selon la quantité
    const count = d.quantity;
    const existing = d.participants ?? [];
    const filled = Array.from({ length: count }, (_, i) => ({
      firstName: existing[i]?.firstName ?? '',
      lastName: existing[i]?.lastName ?? '',
      email: existing[i]?.email ?? '',
    }));

    setValue('participants', filled);
    if (d.payerPhone) setValue('payerPhone', d.payerPhone);
    if (d.payerName) setValue('payerName', d.payerName);
    if (d.payerAddress) setValue('payerAddress', d.payerAddress);
  }, [locale, router, setValue]);

  const onSubmit = (data: FormValues) => {
    patchDraft({
      payerPhone: data.payerPhone,
      payerName: data.payerName || undefined,
      payerAddress: data.payerAddress,
      participants: data.participants.map((p) => ({
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email || undefined,
      })),
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

        {/* Stepper */}
        <ol className="mb-8 grid grid-cols-3 gap-2 rounded-full bg-white p-2 shadow-sm">
          {STEPS.map((label, index) => (
            <li
              key={label}
              aria-current={index === 1 ? 'step' : undefined}
              className={`flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition-colors ${
                index === 1
                  ? 'bg-brand-navy text-white'
                  : index < 1
                  ? 'text-brand-gold'
                  : 'text-brand-muted'
              }`}
            >
              {index + 1} · {label}
            </li>
          ))}
        </ol>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Section A : Payeur */}
            <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm lg:p-8">
              <h2 className="text-xl font-bold text-brand-navy">A. Informations du payeur</h2>
              <p className="mt-1 text-sm text-brand-muted">
                Numéro depuis lequel sera effectué le paiement Mobile Money.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2 lg:col-span-1">
                  <span className="text-sm font-semibold text-brand-navy">
                    Numéro de téléphone *
                  </span>
                  <input
                    {...register('payerPhone')}
                    type="tel"
                    placeholder="+241 77 000 000"
                    className={`mt-1 ${inputClass}`}
                  />
                  {errors.payerPhone && (
                    <p className="mt-1 text-xs text-semantic-error">{errors.payerPhone.message}</p>
                  )}
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-brand-navy">
                    Nom complet{' '}
                    <span className="font-normal text-brand-muted">(optionnel)</span>
                  </span>
                  <input
                    {...register('payerName')}
                    placeholder="Prénom Nom"
                    className={`mt-1 ${inputClass}`}
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-sm font-semibold text-brand-navy">Adresse *</span>
                  <input
                    {...register('payerAddress')}
                    placeholder="Quartier, ville, point de repère…"
                    className={`mt-1 ${inputClass}`}
                  />
                  <span className="mt-1 block text-xs text-brand-muted">
                    Adresse de livraison des certificats et documents (pour vous et toutes vos places).
                  </span>
                  {errors.payerAddress && (
                    <p className="mt-1 text-xs text-semantic-error">{errors.payerAddress.message}</p>
                  )}
                </label>
              </div>
            </section>

            {/* Section B : Participants */}
            <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm lg:p-8">
              <h2 className="text-xl font-bold text-brand-navy">B. Participants</h2>
              <p className="mt-1 text-sm text-brand-muted">
                {draft.quantity === 1
                  ? 'Vous avez choisi 1 place.'
                  : `Vous avez choisi ${draft.quantity} places — renseignez chaque participant.`}
              </p>

              <div className="mt-5 space-y-5">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="rounded-xl border border-black/5 bg-brand-cream p-4"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-full bg-brand-navy text-xs font-bold text-white">
                        {index + 1}
                      </span>
                      <p className="text-sm font-semibold text-brand-navy">
                        Participant {index + 1}
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                          Prénom *
                        </span>
                        <input
                          {...register(`participants.${index}.firstName`)}
                          className={`mt-1 ${inputClass}`}
                        />
                        {errors.participants?.[index]?.firstName && (
                          <p className="mt-1 text-xs text-semantic-error">
                            {errors.participants[index]?.firstName?.message}
                          </p>
                        )}
                      </label>
                      <label className="block">
                        <span className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                          Nom *
                        </span>
                        <input
                          {...register(`participants.${index}.lastName`)}
                          className={`mt-1 ${inputClass}`}
                        />
                        {errors.participants?.[index]?.lastName && (
                          <p className="mt-1 text-xs text-semantic-error">
                            {errors.participants[index]?.lastName?.message}
                          </p>
                        )}
                      </label>
                      <label className="block sm:col-span-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                          Email{' '}
                          <span className="font-normal normal-case">(fortement recommandé)</span>
                        </span>
                        <input
                          {...register(`participants.${index}.email`)}
                          type="email"
                          placeholder="email@exemple.com"
                          className={`mt-1 ${inputClass}`}
                        />
                        {errors.participants?.[index]?.email && (
                          <p className="mt-1 text-xs text-semantic-error">
                            {errors.participants[index]?.email?.message}
                          </p>
                        )}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Consentement */}
            <div className="rounded-xl border border-black/5 bg-white p-4 shadow-sm">
              <label className="flex items-start gap-3">
                <input
                  {...register('consent')}
                  type="checkbox"
                  className="mt-0.5 size-4 shrink-0 accent-brand-gold"
                />
                <span className="text-sm text-brand-muted">
                  J&apos;accepte que les données fournies soient utilisées pour la gestion de ma
                  réservation et l&apos;envoi des billets. Ces données ne seront pas partagées avec
                  des tiers.
                </span>
              </label>
              {errors.consent && (
                <p className="mt-2 text-xs text-semantic-error">{errors.consent.message}</p>
              )}
            </div>

            <Button type="submit" variant="gold" size="lg" className="w-full">
              Payer maintenant
            </Button>
          </form>

          {/* Récapitulatif */}
          <aside className="h-fit rounded-2xl bg-[linear-gradient(160deg,#0E2450_5%,#2152B6_95%)] p-5 text-white shadow-lg">
            <div className="flex items-center gap-2">
              <User className="size-4 text-white/60" />
              <h2 className="text-lg font-bold">{draft.eventTitle}</h2>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-white/60">Billet</dt>
                <dd className="font-semibold">{draft.ticketName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/60">Places</dt>
                <dd className="font-semibold">{draft.quantity}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/60">Prix / place</dt>
                <dd className="font-semibold">{formatPrice(draft.unitPrice, draft.currency)}</dd>
              </div>
            </dl>
            <div className="mt-5 flex items-baseline justify-between border-t border-white/15 pt-4">
              <span className="text-lg font-bold">Total</span>
              <span className="text-2xl font-extrabold">{formatPrice(total, draft.currency)}</span>
            </div>
            <p className="mt-4 rounded-lg bg-white/10 p-3 text-xs text-white/70">
              Votre billet électronique vous sera envoyé par email après validation du paiement.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
