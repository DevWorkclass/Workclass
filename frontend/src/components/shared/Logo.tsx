/**
 * Logo Work Class Group — chevrons tricolores (teal / vert / doré) + wordmark.
 */
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  /** Masque le texte, garde la marque graphique seule. */
  iconOnly?: boolean;
}

export function Logo({ className, iconOnly = false }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg
        viewBox="0 0 96 56"
        className="h-7 w-auto"
        role="img"
        aria-label="Work Class Group"
      >
        <path d="M44 4 22 28l22 24h8L30 28 52 4z" fill="#1CA1AA" />
        <path d="M28 4 6 28l22 24h8L14 28 36 4z" fill="#24A775" />
        <path d="M12 4 -10 28l22 24h8L-2 28 20 4z" fill="#ECAB11" transform="translate(12 0)" />
      </svg>
      {!iconOnly && (
        <span className="flex flex-col leading-none">
          <span className="text-base font-extrabold tracking-tight text-brand-navy">
            Work<span className="text-brand-gold">Class</span>
          </span>
          <span className="text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-brand-muted">
            Group
          </span>
        </span>
      )}
    </span>
  );
}
