import type { ReactNode } from 'react';

import { FloatingButtons } from './FloatingButtons';
import { Footer } from './Footer';
import { Header } from './Header';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      <Header />
      {/* Décalage pour la barre fixe (h-16). */}
      <div className="h-16 shrink-0" aria-hidden />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingButtons />
    </div>
  );
}
