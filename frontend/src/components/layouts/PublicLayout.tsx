import type { ReactNode } from 'react';

interface PublicLayoutProps {
  children: ReactNode;
}

/**
 * Layout des pages publiques (Header + contenu + Footer).
 * À enrichir en session UI/UX.
 */
export function PublicLayout({ children }: PublicLayoutProps) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
