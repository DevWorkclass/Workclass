'use client';

/**
 * Admin — Publicités & Annonces (carrousel d'accueil). Branché backend.
 *  - GET  /content/ads
 *  - POST /admin/content/ads          { ads }   (guard content:manage)
 *  - POST /admin/content/upload-image (image)
 */
import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { Badge } from '@/components/admin/Badge';
import { PageHeader } from '@/components/admin/PageHeader';
import { Button } from '@/components/ui/button';
import { apiAuth, apiFetch, apiUpload, ApiError } from '@/lib/api';

interface AdSlide {
  tag?: string;
  title: string;
  body?: string;
  cta?: string;
  href?: string;
  imageUrl?: string;
  active: boolean;
}

const inputClass =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold';

function AdCard({
  ad,
  onChange,
  onRemove,
}: Readonly<{
  ad: AdSlide;
  onChange: (p: Partial<AdSlide>) => void;
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
    <li className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div
        className="aspect-[16/9] rounded-xl bg-brand-navy-deep/90 bg-cover bg-center"
        style={ad.imageUrl ? { backgroundImage: `url(${ad.imageUrl})` } : undefined}
        aria-hidden
      />
      <div className="mt-4 space-y-2">
        <input value={ad.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Titre *" className={`${inputClass} font-semibold`} />
        <input value={ad.tag ?? ''} onChange={(e) => onChange({ tag: e.target.value })} placeholder="Étiquette (ex: Partenaire officiel)" className={inputClass} />
        <textarea value={ad.body ?? ''} onChange={(e) => onChange({ body: e.target.value })} rows={2} placeholder="Texte" className={inputClass} />
        <div className="grid grid-cols-2 gap-2">
          <input value={ad.cta ?? ''} onChange={(e) => onChange({ cta: e.target.value })} placeholder="Bouton (CTA)" className={inputClass} />
          <input value={ad.href ?? ''} onChange={(e) => onChange({ href: e.target.value })} placeholder="/page, # ou https://…" className={inputClass} />
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        aria-label={`Image de ${ad.title || 'annonce'}`}
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-brand-navy">
          <input type="checkbox" checked={ad.active} onChange={(e) => onChange({ active: e.target.checked })} className="size-4 accent-brand-gold" />
          {ad.active ? <Badge tone="success" dot>Active</Badge> : <Badge tone="neutral">Inactive</Badge>}
        </label>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? '…' : 'Image'}
          </Button>
          <Button type="button" variant="ghost" size="sm" className="text-semantic-error" onClick={onRemove}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </li>
  );
}

export default function AdminAdsPage() {
  const [ads, setAds] = useState<AdSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ data: AdSlide[] }>('/content/ads')
      .then((res) => setAds(res.data))
      .catch(() => setError('Impossible de charger les annonces.'))
      .finally(() => setLoading(false));
  }, []);

  const patch = (i: number, p: Partial<AdSlide>) =>
    setAds((l) => l.map((x, idx) => (idx === i ? { ...x, ...p } : x)));

  const save = async () => {
    try {
      setError(null);
      setMessage(null);
      setSaving(true);
      await apiAuth('/admin/content/ads', { method: 'POST', body: JSON.stringify({ ads }) });
      setMessage('Annonces enregistrées.');
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setError('Permission « Gérer le contenu du site » requise.');
      else if (err instanceof ApiError && err.status === 422) setError('Une annonce est invalide (titre manquant ou lien non autorisé).');
      else setError("L'enregistrement a échoué.");
    } finally {
      setSaving(false);
    }
  };

  const activeCount = ads.filter((a) => a.active).length;

  return (
    <>
      <PageHeader
        title="Publicités & Annonces"
        subtitle="Carrousel publicitaire de la page d'accueil"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setAds((l) => [...l, { title: '', active: true }])}>
              <Plus className="mr-1 size-4" /> Ajouter
            </Button>
            <Button variant="gold" size="sm" disabled={saving || loading} onClick={save}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold text-brand-navy">Annonces actives ({activeCount})</h2>
        <p className="text-sm text-brand-muted">Seules les annonces actives s&apos;affichent sur l&apos;accueil.</p>
      </div>

      {message && <p className="mb-3 text-sm text-semantic-success">{message}</p>}
      {error && (
        <p role="alert" className="mb-3 text-sm text-semantic-error">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-brand-muted">Chargement…</p>
      ) : ads.length === 0 ? (
        <p className="text-sm text-brand-muted">Aucune annonce. Cliquez sur « Ajouter ».</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {ads.map((ad, i) => (
            <AdCard key={i} ad={ad} onChange={(p) => patch(i, p)} onRemove={() => setAds((l) => l.filter((_, idx) => idx !== i))} />
          ))}
        </ul>
      )}
    </>
  );
}
