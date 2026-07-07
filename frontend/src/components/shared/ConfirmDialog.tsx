'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  /**
   * Active une double confirmation : un premier clic affiche un avertissement
   * supplémentaire ; un second clic valide réellement l'action.
   * Recommandé pour toutes les suppressions irréversibles.
   */
  doubleConfirm?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmer',
  doubleConfirm = true,
  onConfirm,
  onCancel,
}: Readonly<ConfirmDialogProps>) {
  const [armed, setArmed] = useState(false);

  // Réinitialise l'état de double-confirmation à chaque ouverture/fermeture.
  useEffect(() => {
    if (!open) setArmed(false);
  }, [open]);

  if (!open) return null;

  const handleConfirm = () => {
    if (doubleConfirm && !armed) {
      setArmed(true);
      return;
    }
    onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-base font-bold text-brand-navy">{title}</h2>
          <button
            type="button"
            aria-label="Fermer"
            onClick={onCancel}
            className="grid size-7 shrink-0 place-items-center rounded-lg text-brand-muted hover:bg-brand-navy/5"
          >
            <X className="size-4" />
          </button>
        </div>

        {description && (
          <p className="text-sm text-brand-muted">{description}</p>
        )}

        {doubleConfirm && armed && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-semantic-error/30 bg-semantic-error/5 p-3 text-sm text-semantic-error">
            <AlertTriangle className="size-4 shrink-0" />
            <p>
              Action irréversible. Cliquez à nouveau sur «&nbsp;{confirmLabel}&nbsp;» pour confirmer
              définitivement.
            </p>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            className={armed ? 'animate-pulse' : undefined}
          >
            {armed ? `${confirmLabel} (définitif)` : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
