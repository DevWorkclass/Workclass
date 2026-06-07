'use client';

/**
 * Boutons d'export CSV / PDF.
 * Délègue la génération au backend (POST → fichier en pièce jointe).
 * Le chemin est passé SANS préfixe `/api` (déjà présent dans apiUrl).
 */
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { apiDownload, ApiError } from '@/lib/api';

interface ExportButtonsProps {
  /** Chemin backend, ex. `/admin/bookings/export` (sans `/api`). */
  path: string;
  /** Filtres envoyés dans le body (status, eventId…). */
  filters?: Record<string, unknown>;
  /** Préfixe du nom de fichier de secours. */
  fallbackName?: string;
}

export function ExportButtons({ path, filters = {}, fallbackName = 'export' }: ExportButtonsProps) {
  const [busy, setBusy] = useState<null | 'csv' | 'pdf'>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (format: 'csv' | 'pdf') => {
    try {
      setError(null);
      setBusy(format);
      await apiDownload(path, { ...filters, format }, `${fallbackName}.${format}`);
    } catch (err) {
      const message =
        err instanceof ApiError && err.status === 401
          ? 'Session expirée, reconnectez-vous.'
          : "L'export a échoué.";
      setError(message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => run('csv')}>
        {busy === 'csv' ? 'Export…' : 'Exporter CSV'}
      </Button>
      <Button variant="gold" size="sm" disabled={busy !== null} onClick={() => run('pdf')}>
        {busy === 'pdf' ? 'Export…' : 'Exporter PDF'}
      </Button>
      {error && (
        <span role="alert" className="text-xs text-semantic-error">
          {error}
        </span>
      )}
    </div>
  );
}
