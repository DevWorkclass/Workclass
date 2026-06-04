/**
 * Pastille de statut admin (success / warning / error / neutral / info).
 */
import { cn } from '@/lib/utils';

export type BadgeTone = 'success' | 'warning' | 'error' | 'neutral' | 'info';

interface BadgeProps {
  tone?: BadgeTone;
  dot?: boolean;
  children: React.ReactNode;
}

const TONE: Record<BadgeTone, string> = {
  success: 'bg-semantic-success/10 text-semantic-success',
  warning: 'bg-brand-gold/15 text-brand-gold',
  error: 'bg-semantic-error/10 text-semantic-error',
  neutral: 'bg-black/5 text-brand-muted',
  info: 'bg-semantic-info/10 text-semantic-info',
};

export function Badge({ tone = 'neutral', dot = false, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        TONE[tone],
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden /> : null}
      {children}
    </span>
  );
}
