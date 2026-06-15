'use client';

/**
 * Réglage admin — QR code de partage pour l'installation de l'app (PWA).
 *  - GET /content/install-qr : renvoie le QR code (data URL PNG) de l'URL publique.
 * L'admin peut copier l'URL ou télécharger l'image PNG du QR pour la diffuser
 * (impression, écran d'accueil, message instantané).
 */
import { Copy, Download, QrCode } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';

interface InstallQR {
  url: string;
  qrCodeDataUrl: string;
}

export function InstallQRSettings() {
  const [data, setData] = useState<InstallQR | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiFetch<{ data: InstallQR }>('/content/install-qr')
      .then((res) => setData(res.data))
      .catch(() => setError('Impossible de générer le QR code.'))
      .finally(() => setLoading(false));
  }, []);

  const copyUrl = async () => {
    if (!data?.url) return;
    try {
      await navigator.clipboard.writeText(data.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard refusé : on ignore (l'utilisateur peut sélectionner manuellement) */
    }
  };

  const downloadPng = () => {
    if (!data?.qrCodeDataUrl) return;
    const a = document.createElement('a');
    a.href = data.qrCodeDataUrl;
    a.download = 'workclass-install-qr.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-gold/10 text-brand-gold">
          <QrCode className="size-5" />
        </div>
        <div>
          <h2 className="font-bold text-brand-navy">QR code d&apos;installation de l&apos;app</h2>
          <p className="text-sm text-brand-muted">
            Partagez ce QR pour que les visiteurs ouvrent et installent l&apos;app (PWA) en un scan.
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-semantic-error">
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-5 text-sm text-brand-muted">Génération du QR…</p>
      ) : data ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-[180px_1fr]">
          <div className="grid place-items-center rounded-2xl border border-black/10 bg-brand-cream p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.qrCodeDataUrl}
              alt="QR code d'installation"
              width={160}
              height={160}
              className="size-40 object-contain"
            />
          </div>
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-muted">
                URL de l&apos;app
              </span>
              <input
                value={data.url}
                readOnly
                onFocus={(e) => e.currentTarget.select()}
                className="mt-1 w-full rounded-lg border border-black/10 bg-brand-cream px-3 py-2 text-sm text-brand-navy"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={copyUrl}>
                <Copy className="mr-1.5 size-4" />
                {copied ? 'Copié' : "Copier l'URL"}
              </Button>
              <Button variant="gold" size="sm" onClick={downloadPng}>
                <Download className="mr-1.5 size-4" />
                Télécharger le QR (PNG)
              </Button>
            </div>
            <p className="text-xs text-brand-muted">
              Astuce : sur mobile, l&apos;ouverture du lien propose «&nbsp;Ajouter à l&apos;écran
              d&apos;accueil&nbsp;» — l&apos;app fonctionne ensuite comme une application native.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
