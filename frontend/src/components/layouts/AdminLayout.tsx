'use client';

import { LayoutGrid, Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { ROUTES } from '@/constants/routes';
import { Sidebar } from './Sidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

/**
 * Layout des pages admin : sidebar marine + zone de contenu crème.
 *  - ≥ lg : sidebar fixe à gauche (design inchangé).
 *  - < lg : sidebar en drawer off-canvas, ouverte via la barre top + hamburger.
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Ferme le drawer à chaque navigation (sécurité si un lien ne le fait pas).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-brand-cream">
      <Sidebar open={open} onClose={() => setOpen(false)} />

      {/* Voile sombre derrière le drawer (mobile uniquement) */}
      {open ? (
        <div
          aria-hidden
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barre top mobile : hamburger + logo (cachée en ≥ lg) */}
        <div className="flex h-14 items-center gap-3 border-b border-black/5 bg-white px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
            className="grid size-9 place-items-center rounded-lg text-brand-navy hover:bg-brand-cream"
          >
            <Menu className="size-5" />
          </button>
          <Link href={ROUTES.admin.dashboard} aria-label="Accueil admin">
            <LayoutGrid className="size-6 text-brand-gold" />
          </Link>
        </div>

        <main className="flex-1 overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
