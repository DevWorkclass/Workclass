'use client';

/**
 * Réglage admin — logos des partenaires (page d'accueil).
 *  - GET  /content/partners
 *  - POST /admin/content/partners   { partners }
 *  - POST /admin/content/upload-image (logo)
 */
import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { apiAuth, apiFetch, apiUpload, ApiError } from '@/lib/api';

interface Partner {
  name: string;
  logoUrl?: string;
  description?: string;
}

function PartnerRow({
  partner,
  onChange,
  onRemove,
}: {
  partner: Partner;
  onChange: (p: Partial<Partner>) => void;
  onRemove: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    try {
      setUploading(true);
      const form = new FormData();
      form.append('image', file);
      const res = await apiUpload<{ data: { url: string } }>('/admin/content/upload-image', form);
      onChange({ logoUrl: res.data.url });
    } catch {
      /* erreur silencieuse */
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-black/5 bg-brand-cream p-3">
      <div
        className="size-16 shrink-0 rounded-lg border border-black/10 bg-white bg-contain bg-center bg-no-repeat"
        style={partner.logoUrl ? { backgroundImage: `url(${partner.logoUrl})` } : undefined}
        role="img"
        aria-label={partner.logoUrl ? partner.name : 'Aucun logo'}
      />
      <div className="min-w-0 flex-1 space-y-2">
        <input
          value={partner.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Nom du partenaire"
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
        />
        <input
          value={partner.description ?? ''}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Description (optionnel)"
          className="w-full rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs text-brand-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
        />
      </div>
      <input
        ref={fileRef}
        type="file"
        aria-label={`Logo de ${partner.name || 'partenaire'}`}
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void upload(f);
        }}
      />
      <div className="flex shrink-0 flex-col gap-1">
        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? '…' : 'Logo'}
        </Button>
        <Button type="button" variant="ghost" size="sm" className="text-semantic-error" onClick={onRemove}>
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function PartnersSettings() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<{ data: Partner[] }>('/content/partners')
      .then((res) => setPartners(res.data))
      .catch(() => setError('Impossible de charger les partenaires.'))
      .finally(() => setLoading(false));
  }, []);

  const patch = (i: number, p: Partial<Partner>) =>
    setPartners((list) => list.map((x, idx) => (idx === i ? { ...x, ...p } : x)));

  const save = async (list: Partner[]) => {
    try {
      setError(null);
      setMessage(null);
      setSaving(true);
      await apiAuth('/admin/content/partners', {
        method: 'POST',
        body: JSON.stringify({ partners: list }),
      });
      setMessage('Partenaires enregistrés.');
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 403
          ? "Permission « Gérer le contenu du site » requise."
          : "L'enregistrement a échoué.",
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (confirmIndex === null) return;
    const updated = partners.filter((_, idx) => idx !== confirmIndex);
    setConfirmIndex(null);
    setPartners(updated);
    await save(updated);
  };

  const pendingPartner = confirmIndex !== null ? partners[confirmIndex] : null;

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-brand-navy">Logos des partenaires</h2>
          <p className="text-sm text-brand-muted">Affichés sur la page d&apos;accueil.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPartners((l) => [...l, { name: '' }])}
          >
            <Plus className="mr-1 size-4" /> Ajouter
          </Button>
          <Button variant="gold" size="sm" disabled={saving || loading} onClick={() => save(partners)}>
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
      ) : partners.length === 0 ? (
        <p className="mt-5 text-sm text-brand-muted">Aucun partenaire. Cliquez sur « Ajouter ».</p>
      ) : (
        <div className="mt-5 space-y-3">
          {partners.map((p, i) => (
            <PartnerRow
              key={i}
              partner={p}
              onChange={(patchP) => patch(i, patchP)}
              onRemove={() => setConfirmIndex(i)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmIndex !== null}
        title="Supprimer ce partenaire ?"
        description={pendingPartner?.name ? `« ${pendingPartner.name} » sera supprimé définitivement.` : 'Ce partenaire sera supprimé définitivement.'}
        confirmLabel="Supprimer"
        onCancel={() => setConfirmIndex(null)}
        onConfirm={() => { void confirmDelete(); }}
      />
    </section>
  );
}
