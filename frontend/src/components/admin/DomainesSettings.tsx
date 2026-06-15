'use client';

/**
 * Réglage admin — domaines de la page d'accueil (titre, description, icône, image).
 * L'image est téléversée vers le backend (Supabase Storage) ; la liste est
 * persistée via POST. Visible uniquement si l'admin a la permission `content:manage`.
 */
import { Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { apiAuth, apiFetch, apiUpload, ApiError } from '@/lib/api';

type ThemeIcon = 'briefcase' | 'trending-up' | 'lightbulb' | 'rocket' | 'globe';

interface HomeTheme {
  icon: ThemeIcon;
  title: string;
  description: string;
  imageUrl?: string;
  content?: string;
}

const ICON_OPTIONS: ThemeIcon[] = ['briefcase', 'trending-up', 'lightbulb', 'rocket', 'globe'];

const MAX_THEMES = 12;

const EMPTY_THEME: HomeTheme = {
  icon: 'briefcase',
  title: 'Nouveau module',
  description: 'Décrivez ce module en quelques mots.',
  imageUrl: '',
  content: '',
};

interface ThemeRowProps {
  readonly theme: HomeTheme;
  readonly onChange: (patch: Partial<HomeTheme>) => void;
  readonly onRemove: () => void;
  readonly index: number;
}

function ThemeRow({ theme, onChange, onRemove, index }: ThemeRowProps) {
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

  const confirmRemove = () => {
    const label = theme.title || `n°${index + 1}`;
    if (globalThis.confirm(`Supprimer le module « ${label} » ?`)) {
      onRemove();
    }
  };

  return (
    <div className="relative grid gap-4 rounded-xl border border-black/5 bg-brand-cream p-4 sm:grid-cols-[120px_1fr]">
      <button
        type="button"
        onClick={confirmRemove}
        aria-label={`Supprimer le module ${theme.title}`}
        className="absolute right-3 top-3 grid size-8 place-items-center rounded-full border border-semantic-error/30 bg-white text-semantic-error transition-colors hover:bg-semantic-error hover:text-white"
      >
        <Trash2 className="size-4" />
      </button>
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
            Contenu du module (« Voir plus »)
          </span>
          <textarea
            value={theme.content ?? ''}
            onChange={(e) => onChange({ content: e.target.value })}
            rows={3}
            placeholder="Détail du module affiché au clic sur « Voir plus »"
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

/** ID client stable pour la clé React (non envoyé au backend). */
function newRowId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `t-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function DomainesSettings() {
  const [themes, setThemes] = useState<HomeTheme[]>([]);
  const [rowIds, setRowIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ data: HomeTheme[] }>('/content/home-themes')
      .then((res) => {
        setThemes(res.data);
        setRowIds(res.data.map(() => newRowId()));
      })
      .catch(() => setError('Impossible de charger les domaines.'))
      .finally(() => setLoading(false));
  }, []);

  const patch = (index: number, p: Partial<HomeTheme>) =>
    setThemes((list) => list.map((t, i) => (i === index ? { ...t, ...p } : t)));

  const addTheme = () => {
    setThemes((list) => (list.length >= MAX_THEMES ? list : [...list, { ...EMPTY_THEME }]));
    setRowIds((ids) => (ids.length >= MAX_THEMES ? ids : [...ids, newRowId()]));
  };

  const removeTheme = (index: number) => {
    setThemes((list) => (list.length <= 1 ? list : list.filter((_, i) => i !== index)));
    setRowIds((ids) => (ids.length <= 1 ? ids : ids.filter((_, i) => i !== index)));
  };

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
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={loading || themes.length >= MAX_THEMES}
            onClick={addTheme}
          >
            Ajouter un module
          </Button>
          <Button variant="gold" size="sm" disabled={saving || loading} onClick={save}>
            {saving ? 'Enregistrement…' : 'Enregistrer les domaines'}
          </Button>
        </div>
      </div>
      <p className="mt-1 text-xs text-brand-muted">
        {themes.length} / {MAX_THEMES} modules. Minimum requis : 1.
      </p>

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
            <ThemeRow
              key={rowIds[i] ?? `row-${i}`}
              theme={t}
              index={i}
              onChange={(p) => patch(i, p)}
              onRemove={() => removeTheme(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
