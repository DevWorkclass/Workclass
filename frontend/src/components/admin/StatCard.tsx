/**
 * Carte statistique admin — libellé, valeur mise en avant, indice optionnel.
 * Bordure basse colorée selon l'accent (cf. maquettes dashboard).
 */
import { cn } from '@/lib/utils';

export type StatAccent = 'gold' | 'green' | 'blue' | 'red';

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  accent?: StatAccent;
}

const ACCENT_TEXT: Record<StatAccent, string> = {
  gold: 'text-brand-gold',
  green: 'text-semantic-success',
  blue: 'text-semantic-info',
  red: 'text-semantic-error',
};

const ACCENT_BORDER: Record<StatAccent, string> = {
  gold: 'border-b-brand-gold',
  green: 'border-b-semantic-success',
  blue: 'border-b-semantic-info',
  red: 'border-b-semantic-error',
};

export function StatCard({ label, value, hint, accent = 'gold' }: StatCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-black/5 border-b-2 bg-white p-5 shadow-sm',
        ACCENT_BORDER[accent],
      )}
    >
      <span
        aria-hidden
        className={cn('absolute -right-4 -top-4 size-20 rounded-full opacity-10', {
          'bg-brand-gold': accent === 'gold',
          'bg-semantic-success': accent === 'green',
          'bg-semantic-info': accent === 'blue',
          'bg-semantic-error': accent === 'red',
        })}
      />
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">{label}</p>
      <p className={cn('mt-2 text-3xl font-extrabold', ACCENT_TEXT[accent])}>{value}</p>
      {hint ? <p className="mt-2 text-sm text-brand-muted">{hint}</p> : null}
    </div>
  );
}
