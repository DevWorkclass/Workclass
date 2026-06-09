'use client';

/**
 * Admin — Paramètres → Config (dynamisme de l'app).
 *  - Défilement des témoignages (intervalle + activation) : /content/app-config
 *  - Gestion des logos partenaires : composant PartnersSettings
 */
import { useEffect, useState } from 'react';

import { PageHeader } from '@/components/admin/PageHeader';
import { Button } from '@/components/ui/button';
import { PartnersSettings } from '@/components/admin/PartnersSettings';
import { IndustriesSettings } from '@/components/admin/IndustriesSettings';
import { FooterSettings } from '@/components/admin/FooterSettings';
import { PromotersSettings } from '@/components/admin/PromotersSettings';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { apiAuth, apiFetch, ApiError } from '@/lib/api';

interface AppConfig {
  testimonialIntervalMs: number;
  testimonialAutoScroll: boolean;
}

export default function AdminConfigPage() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ data: AppConfig }>('/content/app-config')
      .then((res) => setConfig(res.data))
      .catch(() => setError('Impossible de charger la configuration.'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!config) return;
    try {
      setError(null);
      setMessage(null);
      setSaving(true);
      await apiAuth('/admin/content/app-config', {
        method: 'POST',
        body: JSON.stringify(config),
      });
      setMessage('Configuration enregistrée.');
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

  return (
    <>
      <PageHeader
        title="Config — Dynamisme de l'app"
        subtitle="Carrousel d'avis et logos partenaires"
        backHref="/admin/parametres"
      />

      <div className="space-y-6">
        <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-brand-navy">Carrousel des témoignages</h2>
            <Button variant="gold" size="sm" disabled={saving || loading || !config} onClick={save}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>

          {message && <p className="mt-3 text-sm text-semantic-success">{message}</p>}
          {error && (
            <p role="alert" className="mt-3 text-sm text-semantic-error">
              {error}
            </p>
          )}

          {loading || !config ? (
            <div className="mt-5">
              <LoadingSpinner label="Chargement…" />
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                  Intervalle de défilement automatique (secondes)
                </span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={Math.round(config.testimonialIntervalMs / 1000)}
                  onChange={(e) =>
                    setConfig((c) =>
                      c ? { ...c, testimonialIntervalMs: Number(e.target.value) * 1000 } : c,
                    )
                  }
                  className="mt-2 w-full max-w-xs rounded-lg border border-black/10 bg-brand-cream px-4 py-2.5 text-sm text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                />
              </label>

              <label className="flex w-full max-w-xs cursor-pointer items-center justify-between py-2">
                <span className="text-sm text-brand-navy">Défilement automatique</span>
                <span className="relative inline-flex">
                  <input
                    type="checkbox"
                    checked={config.testimonialAutoScroll}
                    onChange={(e) =>
                      setConfig((c) => (c ? { ...c, testimonialAutoScroll: e.target.checked } : c))
                    }
                    className="peer sr-only"
                  />
                  <span className="grid size-6 place-items-center rounded-md border border-black/15 bg-white text-white transition-colors peer-checked:border-brand-gold peer-checked:bg-brand-gold">
                    {config.testimonialAutoScroll ? '✓' : ''}
                  </span>
                </span>
              </label>
            </div>
          )}
        </section>

        <PromotersSettings />
        <PartnersSettings />
        <IndustriesSettings />
        <FooterSettings />
      </div>
    </>
  );
}
