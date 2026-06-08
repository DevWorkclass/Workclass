'use client';

/**
 * Header public — sticky, fond crème, logo + nav + CTA doré.
 * Menu mobile repliable.
 */
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';

const NAV_LINKS = [
  { href: ROUTES.public.home, label: 'Accueil' },
  { href: '/#evenement', label: "L'Événement" },
  { href: '/#chronogramme', label: 'Chronogramme' },
  { href: '/#intervenants', label: 'Intervenants' },
  { href: '/#faq', label: 'FAQ' },
  { href: ROUTES.admin.login, label: 'Admin' },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header
      role="banner"
      className="sticky top-0 z-50 border-b border-brand-navy/10 bg-brand-cream/95 backdrop-blur supports-[backdrop-filter]:bg-brand-cream/80"
    >
      <div className="container flex h-16 items-center justify-between">
        <Link href={ROUTES.public.home} aria-label="Accueil Work Class Gabon">
          <Logo />
        </Link>

        <nav
          aria-label="Navigation principale"
          className="hidden items-center gap-5 md:flex lg:gap-7"
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="group relative text-sm font-medium text-brand-navy/80 transition-colors hover:text-brand-navy"
            >
              {label}
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 rounded-full bg-brand-gold transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Button asChild variant="gold" size="sm">
            <Link href={ROUTES.public.reservation.base}>Réserver</Link>
          </Button>
        </div>

        <button
          type="button"
          className="md:hidden"
          {...{ 'aria-label': open ? 'Fermer le menu' : 'Ouvrir le menu', 'aria-expanded': open }}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* Panneau mobile */}
      <div
        className={cn(
          'overflow-hidden border-t border-brand-navy/10 md:hidden',
          open ? 'max-h-96' : 'max-h-0',
          'transition-[max-height] duration-300',
        )}
      >
        <nav aria-label="Navigation mobile" className="container flex flex-col gap-1 py-3">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-brand-navy/80 hover:bg-brand-navy/5"
            >
              {label}
            </Link>
          ))}
          <Button asChild variant="gold" size="sm" className="mt-2">
            <Link href={ROUTES.public.reservation.base} onClick={() => setOpen(false)}>
              Réserver
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
