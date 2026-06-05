'use client';

/**
 * Compte à rebours jusqu'à la date de l'événement.
 * Affiche jours / heures / minutes / secondes en cellules.
 */
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

interface CountdownProps {
  /** Date cible (début événement). */
  target: Date;
  className?: string;
  /** Variant de couleur selon le fond de la section parente. */
  variant?: 'light' | 'dark';
}

interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

function computeRemaining(target: Date): Remaining {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { days, hours, minutes, seconds, done: false };
}

const CELLS: Array<{ key: keyof Omit<Remaining, 'done'>; label: string }> = [
  { key: 'days', label: 'Jours' },
  { key: 'hours', label: 'Heures' },
  { key: 'minutes', label: 'Min' },
  { key: 'seconds', label: 'Sec' },
];

export function Countdown({ target, className, variant = 'light' }: CountdownProps) {
  // null au premier rendu serveur → évite le mismatch d'hydratation.
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    setRemaining(computeRemaining(target));
    const id = setInterval(() => setRemaining(computeRemaining(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div className={cn('grid grid-cols-4 gap-2', className)} role="timer" aria-live="off">
      {CELLS.map(({ key, label }) => (
        <div
          key={key}
          className={cn(
            'flex flex-col items-center rounded-xl px-2 py-3',
            variant === 'dark' ? 'bg-white/10' : 'bg-brand-navy/5',
          )}
        >
          <span
            className={cn(
              'text-2xl font-bold tabular-nums',
              variant === 'dark' ? 'text-white' : 'text-brand-navy',
            )}
          >
            {remaining ? String(remaining[key]).padStart(2, '0') : '--'}
          </span>
          <span
            className={cn(
              'mt-1 text-[0.65rem] font-medium uppercase tracking-wide',
              variant === 'dark' ? 'text-white/50' : 'text-brand-muted',
            )}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
