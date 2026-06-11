'use client';

/**
 * Réglage admin — contenu de la fenêtre « En découvrir plus » (accueil).
 *  - GET  /content/about
 *  - POST /admin/content/about   { title, content }
 */
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { apiAuth, apiFetch, ApiError } from '@/lib/api';

interface About {
  title: string;
  content: string;
}

export function AboutSettings() {
  const [about, setAbout] = useState<About>({ title: '', content: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ data: About }>('/content/about')
      .then((res) => setAbout(res.data))
      .catch(() => setError('Impossible de charger le contenu.'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    try {
      setError(null);
      setMessage(null);
      setSaving(true);
      await apiAuth('/admin/content/about', { method: 'POST', body: JSON.stringify(about) });
      setMessage('Contenu enregistré.');
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 403
          ? 'Permission « Gérer le contenu du site » requise.'
          : "L'enregistrement a échoué.",
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold';

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-brand-navy">Fenêtre « En découvrir plus »</h2>
          <p className="text-sm text-brand-muted">
            Contenu affiché au clic sur « En découvrir plus » (section d&apos;accueil).
          </p>
        </div>
        <Button variant="gold" size="sm" disabled={saving || loading} onClick={save}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>

      {message && <p className="mt-3 text-sm text-semantic-success">{message}</p>}
      {error && (
        <p role="alert" className="mt-3 text-sm text-semantic-error">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-5 text-sm text-brand-muted">Chargement…</p>
      ) : (
        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
              Titre
            </span>
            <input
              value={about.title}
              onChange={(e) => setAbout((a) => ({ ...a, title: e.target.value }))}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
              Contenu
            </span>
            <textarea
              value={about.content}
              onChange={(e) => setAbout((a) => ({ ...a, content: e.target.value }))}
              rows={6}
              className={inputClass}
            />
          </label>
        </div>
      )}
    </section>
  );
}
