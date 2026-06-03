import type { ReactNode } from 'react';

import { Footer } from './Footer';
import { Header } from './Header';

interface PublicLayoutProps {
  children: ReactNode;
}

/**
 * Layout des pages publiques : Header sticky + contenu.
 * (Footer ajouté en composant de section sur la home pour l'instant.)
 */
export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
