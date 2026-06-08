'use client';

/**
 * Header public — sticky, fond crème, logo + nav + CTA doré.
 * Menu mobile repliable.
 *
 * Logique de navigation :
 *  - Sur la homepage : les liens Accueil / Événements / FAQ font un scroll fluide
 *    vers la section correspondante (href="#section" → même page, jamais de navigation).
 *  - Sur une autre page : les liens naviguent vers la homepage + hash, le navigateur
 *    déroule ensuite vers la section.
 */
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useState } from 'react';

import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';

/** Liens avec un identifiant de section (scroll homepage) et un label. */
const SECTION_LINKS = [
  { section: 'accueil',    label: 'Accueil' },
  { section: 'evenements', label: 'Événements' },
  { section: 'faq',        label: 'FAQ' },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const params = useParams<{ locale: string }>();
  const locale = params?.locale ?? 'fr';

  /**
   * Détecte si on est sur la homepage (ex : /fr, /en, /).
   * Regex : "/" seul OU "/<locale>" OU "/<locale>/" sans suite.
   */
  const isHome = pathname === '/' || new RegExp(`^/${locale}/?$`).test(pathname);

  /**
   * Pour un lien de section :
   * - homepage  → "#section"  (relatif, reste sur la page)
   * - autre page → "/<locale>#section" (navigue vers la homepage avec ancre)
   */
  const sectionHref = (section: string) =>
    isHome ? `#${section}` : `/${locale}#${section}`;

  /**
   * Clic sur un lien de section : scroll fluide si l'élément existe sur la page,
   * navigation normale sinon (l'utilisateur est sur une autre page).
   */
  const handleSectionClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    section: string,
  ) => {
    const el = document.getElementById(section);
    if (el) {
      e.preventDefault();
      setOpen(false);
      const top = el.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top, behavior: 'smooth' });
    } else {
      setOpen(false);
    }
  };

  const linkBase =
    'group relative text-sm font-medium text-brand-navy/80 transition-colors hover:text-brand-navy';
  const underline =
    'absolute -bottom-1 left-0 h-0.5 w-0 rounded-full bg-brand-gold transition-all duration-300 group-hover:w-full';

  return (
    <header
      role="banner"
      className="fixed inset-x-0 top-0 z-50 border-b border-brand-navy/10 bg-brand-cream/95 backdrop-blur supports-[backdrop-filter]:bg-brand-cream/80"
    >
      <div className="container flex h-16 items-center justify-between">
        <Link href={`/${locale}`} aria-label="Accueil Work Class Gabon">
          <Logo />
        </Link>

        {/* ── Navigation desktop ── */}
        <nav
          aria-label="Navigation principale"
          className="hidden items-center gap-5 md:flex lg:gap-7"
        >
          {SECTION_LINKS.map(({ section, label }) => (
            <Link
              key={section}
              href={sectionHref(section)}
              onClick={(e) => handleSectionClick(e, section)}
              className={linkBase}
            >
              {label}
              <span className={underline} />
            </Link>
          ))}

          {/* Lien Admin → navigation normale */}
          <Link href={ROUTES.admin.login} className={linkBase}>
            Admin
            <span className={underline} />
          </Link>
        </nav>

        <div className="hidden md:block">
          <Button asChild variant="gold" size="sm">
            <Link href={ROUTES.public.reservation.base}>Réserver</Link>
          </Button>
        </div>

        {/* ── Bouton hamburger ── */}
        <button
          type="button"
          className="md:hidden"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {/* ── Panneau mobile ── */}
      <div
        className={cn(
          'overflow-hidden border-t border-brand-navy/10 md:hidden',
          open ? 'max-h-96' : 'max-h-0',
          'transition-[max-height] duration-300 ease-in-out',
        )}
      >
        <nav aria-label="Navigation mobile" className="container flex flex-col gap-1 py-3">
          {SECTION_LINKS.map(({ section, label }) => (
            <Link
              key={section}
              href={sectionHref(section)}
              onClick={(e) => handleSectionClick(e, section)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-brand-navy/80 transition-colors hover:bg-brand-navy/5 active:bg-brand-navy/10"
            >
              {label}
            </Link>
          ))}

          <Link
            href={ROUTES.admin.login}
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-brand-navy/80 transition-colors hover:bg-brand-navy/5 active:bg-brand-navy/10"
          >
            Admin
          </Link>

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
