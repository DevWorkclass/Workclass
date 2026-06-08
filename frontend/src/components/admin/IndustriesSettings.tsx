'use client';

/**
 * Réglage admin — tuiles « Au service de toutes les industries » (nom + image).
 *  - GET  /content/industries
 *  - POST /admin/content/industries  { industries }
 *  - POST /admin/content/upload-image (image)
 */
import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { apiAuth, apiFetch, apiUpload, ApiError } from '@/lib/api';

interface Industry {
  name: string;
  imageUrl?: string;
}

function IndustryRow({
  item,
  onChange,
  onRemove,
}: Readonly<{
  item: Industry;
  onChange: (p: Partial<Industry>) => void;
  onRemove: () => void;
}>) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    try {
      setUploading(true);
      const form = new FormData();
      form.append('image', file);
      const res = await apiUpload<{ data: { url: string } }>('/admin/content/upload-image', form);
      onChange({ imageUrl: res.data.url });
    } catch {
      /* erreur silencieuse */
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-black/5 bg-brand-cream p-3">
      <div
        className="size-16 shrink-0 rounded-lg border border-black/10 bg-white bg-cover bg-center"
        style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : undefined}
        role="img"
        aria-label={item.imageUrl ? item.name : 'Aucune image'}
      />
      <input
        value={item.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="Nom de l'industrie"
        className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
      />
      <input
        ref={fileRef}
        type="file"
        aria-label={`Image de ${item.name || 'industrie'}`}
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />
      <div className="flex shrink-0 flex-col gap-1">
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? '…' : 'Image'}
        </Button>
        <Button type="button" variant="ghost" size="sm" className="text-semantic-error" onClick={onRemove}>
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function IndustriesSettings() {
  const [items, setItems] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ data: Industry[] }>('/content/industries')
      .then((res) => setItems(res.data))
      .catch(() => setError('Impossible de charger les industries.'))
      .finally(() => setLoading(false));
  }, []);

  const patch = (i: number, p: Partial<Industry>) =>
    setItems((list) => list.map((x, idx) => (idx === i ? { ...x, ...p } : x)));

  const save = async () => {
    try {
      setError(null);
      setMessage(null);
      setSaving(true);
      await apiAuth('/admin/content/industries', {
        method: 'POST',
        body: JSON.stringify({ industries: items }),
      });
      setMessage('Industries enregistrées.');
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

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-brand-navy">Industries (accueil)</h2>
          <p className="text-sm text-brand-muted">
            Tuiles « Au service de toutes les industries » (nom + image).
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setItems((l) => [...l, { name: '' }])}>
            <Plus className="mr-1 size-4" /> Ajouter
          </Button>
          <Button variant="gold" size="sm" disabled={saving || loading} onClick={save}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </div>
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
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {items.map((it, i) => (
            <IndustryRow
              key={i}
              item={it}
              onChange={(p) => patch(i, p)}
              onRemove={() => setItems((l) => l.filter((_, idx) => idx !== i))}
            />
          ))}
        </div>
      )}
    </section>
  );
}
