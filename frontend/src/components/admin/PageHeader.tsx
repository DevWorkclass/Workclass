/**
 * En-tête de page admin — titre, sous-titre et zone d'actions optionnelle.
 */
import Link from 'next/link';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  backHref?: string;
}

export function PageHeader({ title, subtitle, actions, backHref }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        {backHref && (
          <Link href={backHref} className="mb-2 inline-flex items-center text-sm font-medium text-brand-gold hover:underline">
            ← Retour
          </Link>
        )}
        <h1 className="text-3xl font-extrabold text-brand-navy">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-brand-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
