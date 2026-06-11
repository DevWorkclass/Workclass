'use client';

/**
 * Footer public — contenu éditable depuis l'admin (GET /content/footer),
 * repli statique sinon. Compacté sur mobile pour limiter le scroll.
 */
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Logo } from '@/components/shared/Logo';
import { ROUTES } from '@/constants/routes';
import { apiFetch } from '@/lib/api';

interface FooterLink {
  label: string;
  href: string;
}
interface FooterColumn {
  title: string;
  links: FooterLink[];
}
interface FooterContent {
  description: string;
  contactEmail: string;
  location: string;
  columns: FooterColumn[];
}

const FALLBACK: FooterContent = {
  description: "Plateforme de réservation et de gestion d'événements professionnels au Gabon.",
  contactEmail: 'support@workclass.com',
  location: 'Libreville, Gabon',
  columns: [
    {
      title: 'Événement',
      links: [
        { label: "L'Événement", href: '/#evenement' },
        { label: 'Événements', href: '/evenements' },
      ],
    },
    {
      title: 'Réservation',
      links: [
        { label: 'Réserver', href: '/reservation' },
        { label: 'Mon billet', href: '/participant' },
        { label: 'FAQ', href: '/#faq' },
      ],
    },
    {
      title: 'Contact',
      links: [{ label: 'Devenir partenaire', href: '#' }],
    },
  ],
};

export function Footer() {
  const [footer, setFooter] = useState<FooterContent>(FALLBACK);

  useEffect(() => {
    apiFetch<{ data: FooterContent }>('/content/footer')
      .then((res) => {
        if (res.data && Array.isArray(res.data.columns)) setFooter(res.data);
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="border-t border-brand-navy/10 bg-brand-cream">
      <div className="container grid gap-6 py-8 sm:grid-cols-2 sm:gap-10 sm:py-12 lg:grid-cols-4">
        <div>
          {/* Logo → accès admin (discret, derrière la marque). */}
          <Link href={ROUTES.admin.login} aria-label="Espace administrateur" className="inline-block">
            <Logo />
          </Link>
          <p className="mt-3 max-w-xs text-sm text-brand-muted sm:mt-4">{footer.description}</p>
          {footer.contactEmail && (
            <a
              href={`mailto:${footer.contactEmail}`}
              className="mt-2 inline-block text-sm text-brand-muted hover:text-brand-navy"
            >
              {footer.contactEmail}
            </a>
          )}
        </div>

        {footer.columns.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-navy">
              {col.title}
            </h3>
            <ul className="mt-3 space-y-1.5 sm:mt-4 sm:space-y-2">
              {col.links.map((l) => (
                <li key={`${l.label}-${l.href}`}>
                  <Link href={l.href} className="text-sm text-brand-muted hover:text-brand-navy">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-brand-navy/10">
        <div className="container flex flex-col items-center justify-between gap-1 py-3 text-xs text-brand-muted sm:flex-row sm:gap-2 sm:py-4">
          <span>© {new Date().getFullYear()} Work Class Gabon. Tous droits réservés.</span>
          <span>{footer.location}</span>
        </div>
      </div>
    </footer>
  );
}
