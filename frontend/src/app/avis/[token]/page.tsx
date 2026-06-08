'use client';

/**
 * Page publique — formulaire d'avis accessible via le lien envoyé aux participants
 * (1h avant la fin de l'événement, pour les billets scannés).
 *  - Valide le token  : POST /api/feedback/validate { token }
 *  - Soumet l'avis    : POST /api/feedback/submit   { token, ratings, comment }
 */
import { use, useEffect, useState } from 'react';

import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { apiFetch, ApiError } from '@/lib/api';

const CRITERIA: { key: string; label: string }[] = [
  { key: 'organisation', label: 'Organisation' },
  { key: 'contenu', label: 'Contenu / programme' },
  { key: 'intervenants', label: 'Intervenants' },
  { key: 'global', label: 'Appréciation globale' },
];

function StarInput({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-brand-navy">{label}</span>
      <div className="flex gap-1" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
            onClick={() => onChange(n)}
            className={`text-2xl leading-none transition-colors ${
              n <= value ? 'text-brand-gold' : 'text-brand-muted/30'
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FeedbackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [eventTitle, setEventTitle] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'invalid' | 'done'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<{ data: { eventTitle: string } }>('/feedback/validate', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        setEventTitle(res.data.eventTitle);
        setStatus('ready');
      })
      .catch((err) => {
        setStatus('invalid');
        setErrorMsg(
          err instanceof ApiError
            ? 'Ce lien est invalide, déjà utilisé ou expiré.'
            : 'Impossible de vérifier le lien.',
        );
      });
  }, [token]);

  const submit = async () => {
    // Toutes les notes requises.
    if (CRITERIA.some((c) => !ratings[c.key])) {
      setErrorMsg('Merci de noter chaque critère.');
      return;
    }
    try {
      setErrorMsg(null);
      setSubmitting(true);
      await apiFetch('/feedback/submit', {
        method: 'POST',
        body: JSON.stringify({ token, ratings, comment: comment.trim() || undefined }),
      });
      setStatus('done');
    } catch {
      setErrorMsg("L'envoi a échoué. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-cream px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
          {status === 'loading' && <p className="text-center text-brand-muted">Vérification du lien…</p>}

          {status === 'invalid' && (
            <div className="text-center">
              <h1 className="text-lg font-bold text-brand-navy">Lien indisponible</h1>
              <p className="mt-2 text-sm text-semantic-error">{errorMsg}</p>
            </div>
          )}

          {status === 'done' && (
            <div className="text-center">
              <p className="text-4xl">🎉</p>
              <h1 className="mt-3 text-lg font-bold text-brand-navy">Merci pour votre avis !</h1>
              <p className="mt-2 text-sm text-brand-muted">
                Votre retour nous aide à améliorer nos prochains événements.
              </p>
            </div>
          )}

          {status === 'ready' && (
            <>
              <h1 className="text-lg font-bold text-brand-navy">Votre avis</h1>
              {eventTitle && <p className="mt-1 text-sm text-brand-muted">{eventTitle}</p>}

              <div className="mt-6 space-y-4">
                {CRITERIA.map((c) => (
                  <StarInput
                    key={c.key}
                    label={c.label}
                    value={ratings[c.key] ?? 0}
                    onChange={(v) => setRatings((r) => ({ ...r, [c.key]: v }))}
                  />
                ))}
              </div>

              <label htmlFor="comment" className="mt-6 block text-sm font-semibold text-brand-navy">
                Commentaire (optionnel)
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="Partagez votre expérience…"
                className="mt-1 w-full rounded-lg border border-black/10 bg-brand-cream px-3 py-2 text-sm text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
              />

              {errorMsg && <p className="mt-3 text-sm text-semantic-error">{errorMsg}</p>}

              <Button variant="gold" className="mt-5 w-full" disabled={submitting} onClick={submit}>
                {submitting ? 'Envoi…' : 'Envoyer mon avis'}
              </Button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
