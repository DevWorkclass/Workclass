/**
 * Footer public — logo + colonnes de liens + mentions.
 */
import Link from 'next/link';

import { Logo } from '@/components/shared/Logo';

import { ROUTES } from '@/constants/routes';

const COLUMNS = [
  {
    title: 'Événement',
    links: [
      { href: '/#evenement', label: "L'Événement" },
      { href: '/#chronogramme', label: 'Chronogramme' },
      { href: '/#intervenants', label: 'Intervenants' },
    ],
  },
  {
    title: 'Réservation',
    links: [
      { href: ROUTES.public.reservation.base, label: 'Réserver' },
      { href: ROUTES.public.participant.base, label: 'Mon billet' },
      { href: '/#faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Contact',
    links: [
      { href: 'mailto:support@workclass.com', label: 'support@workclass.com' },
      { href: '#', label: 'Devenir partenaire' },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-brand-navy/10 bg-brand-cream">
      <div className="container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-brand-muted">
            Plateforme de réservation et de gestion d’événements professionnels au Gabon.
          </p>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-navy">
              {col.title}
            </h3>
            <ul className="mt-4 space-y-2">
              {col.links.map((l) => (
                <li key={l.label}>
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
        <div className="container flex flex-col items-center justify-between gap-2 py-4 text-xs text-brand-muted sm:flex-row">
          <span>© {new Date().getFullYear()} Work Class Gabon. Tous droits réservés.</span>
          <span>Libreville, Gabon</span>
        </div>
      </div>
    </footer>
  );
}
