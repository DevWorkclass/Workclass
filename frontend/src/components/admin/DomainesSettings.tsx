'use client';

/**
 * Réglage admin — domaines de la page d'accueil (titre, description, icône, image).
 * L'image est téléversée vers le backend (Supabase Storage) ; la liste est
 * persistée via POST. Visible uniquement si l'admin a la permission `content:manage`.
 */
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { apiAuth, apiFetch, apiUpload, ApiError } from '@/lib/api';

type ThemeIcon = 'briefcase' | 'trending-up' | 'lightbulb' | 'rocket' | 'globe';

interface HomeTheme {
  icon: ThemeIcon;
  title: string;
  description: string;
  imageUrl?: string;
}

const ICON_OPTIONS: ThemeIcon[] = ['briefcase', 'trending-up', 'lightbulb', 'rocket', 'globe'];

function ThemeRow({
  theme,
  onChange,
}: {
  theme: HomeTheme;
  onChange: (patch: Partial<HomeTheme>) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    try {
      setUploadError(null);
      setUploading(true);
      const form = new FormData();
      form.append('image', file);
      const res = await apiUpload<{ data: { url: string } }>(
        '/admin/content/upload-image',
        form,
      );
      onChange({ imageUrl: res.data.url });
    } catch {
      setUploadError("Échec de l'upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid gap-4 rounded-xl border border-black/5 bg-brand-cream p-4 sm:grid-cols-[120px_1fr]">
      <div className="space-y-2">
        <div
          className="aspect-[3/4] w-full rounded-lg border border-black/10 bg-white bg-cover bg-center"
          style={theme.imageUrl ? { backgroundImage: `url(${theme.imageUrl})` } : undefined}
          role="img"
          aria-label={theme.imageUrl ? theme.title : 'Aucune image'}
        />
        <input
          ref={fileRef}
          type="file"
          aria-label={`Image du domaine ${theme.title}`}
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void handleFile(f);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? 'Envoi…' : 'Changer image'}
        </Button>
        {uploadError && <p className="text-xs text-semantic-error">{uploadError}</p>}
      </div>

      <div className="space-y-3">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
            Titre
          </span>
          <input
            value={theme.title}
            onChange={(e) => onChange({ title: e.target.value })}
            className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
            Description
          </span>
          <textarea
            value={theme.description}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={2}
            className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
            Icône (si aucune image)
          </span>
          <select
            value={theme.icon}
            onChange={(e) => onChange({ icon: e.target.value as ThemeIcon })}
            className="mt-1 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
          >
            {ICON_OPTIONS.map((ic) => (
              <option key={ic} value={ic}>
                {ic}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

export function DomainesSettings() {
  const [themes, setThemes] = useState<HomeTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ data: HomeTheme[] }>('/content/home-themes')
      .then((res) => setThemes(res.data))
      .catch(() => setError('Impossible de charger les domaines.'))
      .finally(() => setLoading(false));
  }, []);

  const patch = (index: number, p: Partial<HomeTheme>) =>
    setThemes((list) => list.map((t, i) => (i === index ? { ...t, ...p } : t)));

  const save = async () => {
    try {
      setError(null);
      setMessage(null);
      setSaving(true);
      await apiAuth('/admin/content/home-themes', {
        method: 'POST',
        body: JSON.stringify({ themes }),
      });
      setMessage('Domaines enregistrés.');
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 403
          ? "Vous n'avez pas la permission « Gérer le contenu du site »."
          : "L'enregistrement a échoué.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm xl:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-brand-navy">Domaines (page d&apos;accueil)</h2>
          <p className="text-sm text-brand-muted">
            Image, titre et description de chaque domaine affiché sur le site public.
          </p>
        </div>
        <Button variant="gold" size="sm" disabled={saving || loading} onClick={save}>
          {saving ? 'Enregistrement…' : 'Enregistrer les domaines'}
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
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {themes.map((t, i) => (
            <ThemeRow key={i} theme={t} onChange={(p) => patch(i, p)} />
          ))}
        </div>
      )}
    </section>
  );
}
