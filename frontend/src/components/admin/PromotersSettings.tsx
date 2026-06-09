'use client';

/**
 * Réglage admin — porteurs du projet (cartes de l'accueil).
 *  - GET  /content/promoters
 *  - POST /admin/content/promoters   { promoters }
 *  - POST /admin/content/upload-image (photo)
 */
import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { apiAuth, apiFetch, apiUpload, ApiError } from '@/lib/api';

interface Promoter {
  name: string;
  role?: string;
  photoUrl?: string;
}

function PromoterRow({
  promoter,
  onChange,
  onRemove,
}: Readonly<{
  promoter: Promoter;
  onChange: (p: Partial<Promoter>) => void;
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
      onChange({ photoUrl: res.data.url });
    } catch {
      /* erreur silencieuse */
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-black/5 bg-brand-cream p-3">
      <div
        className="size-16 shrink-0 rounded-full border border-black/10 bg-white bg-cover bg-center"
        style={promoter.photoUrl ? { backgroundImage: `url(${promoter.photoUrl})` } : undefined}
        role="img"
        aria-label={promoter.photoUrl ? promoter.name : 'Aucune photo'}
      />
      <div className="min-w-0 flex-1 space-y-2">
        <input
          value={promoter.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Nom du porteur"
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
        />
        <input
          value={promoter.role ?? ''}
          onChange={(e) => onChange({ role: e.target.value })}
          placeholder="Rôle / fonction (optionnel)"
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs text-brand-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
        />
      </div>
      <input
        ref={fileRef}
        type="file"
        aria-label={`Photo de ${promoter.name || 'porteur'}`}
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />
      <div className="flex shrink-0 flex-col gap-1">
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? '…' : 'Photo'}
        </Button>
        <Button type="button" variant="ghost" size="sm" className="text-semantic-error" onClick={onRemove}>
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function PromotersSettings() {
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ data: Promoter[] }>('/content/promoters')
      .then((res) => setPromoters(res.data))
      .catch(() => setError('Impossible de charger les porteurs.'))
      .finally(() => setLoading(false));
  }, []);

  const patch = (i: number, p: Partial<Promoter>) =>
    setPromoters((l) => l.map((x, idx) => (idx === i ? { ...x, ...p } : x)));

  const save = async () => {
    try {
      setError(null);
      setMessage(null);
      setSaving(true);
      await apiAuth('/admin/content/promoters', { method: 'POST', body: JSON.stringify({ promoters }) });
      setMessage('Porteurs enregistrés.');
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
          <h2 className="font-bold text-brand-navy">Porteurs du projet (accueil)</h2>
          <p className="text-sm text-brand-muted">Cartes défilantes affichées sur la page d&apos;accueil.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPromoters((l) => [...l, { name: '' }])}>
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
      ) : promoters.length === 0 ? (
        <p className="mt-5 text-sm text-brand-muted">Aucun porteur. Cliquez sur « Ajouter ».</p>
      ) : (
        <div className="mt-5 space-y-3">
          {promoters.map((p, i) => (
            <PromoterRow
              key={i}
              promoter={p}
              onChange={(patchP) => patch(i, patchP)}
              onRemove={() => setPromoters((l) => l.filter((_, idx) => idx !== i))}
            />
          ))}
        </div>
      )}
    </section>
  );
}
