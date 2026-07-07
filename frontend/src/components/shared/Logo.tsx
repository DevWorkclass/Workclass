/**
 * Logo Work Class — image officielle (logo-icone.png) + wordmark optionnel.
 * Affiché dans l'en-tête public, le shell admin et l'écran de connexion.
 */
import Image from 'next/image';

import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  /** Masque le texte, garde la marque graphique seule. */
  iconOnly?: boolean;
  /** Taille de l'icône en pixels (carré). */
  size?: number;
}

export function Logo({ className, iconOnly = false, size = 40 }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Image
        src="/assets/images/logo/logo-icone.png"
        alt="Work Class"
        width={size}
        height={size}
        priority
        style={{ width: size, height: 'auto' }}
        className="object-contain"
      />
      {!iconOnly && (
        <span className="flex flex-col leading-none">
          <span className="text-base font-extrabold tracking-tight text-brand-navy">
            Work<span className="text-brand-gold">Class</span>
          </span>
          <span className="text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-brand-muted">
            Gabon
          </span>
        </span>
      )}
    </span>
  );
}
