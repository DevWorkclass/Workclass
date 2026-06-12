'use client';

/**
 * Sidebar de navigation admin — marine, groupée par sections.
 * Met en évidence la route active via `usePathname`.
 */
import {
  Award,
  BarChart3,
  CalendarDays,
  Home,
  Megaphone,
  MessageSquare,
  ScanLine,
  Settings,
  Ticket,
  Users,
  UserCog,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

import { Logo } from '@/components/shared/Logo';
import { ROUTES } from '@/constants/routes';
import { ROUTE_PERMISSIONS } from '@/constants/permissions';
import { hasPermission } from '@/lib/auth';
import { useAuthUser } from '@/domains/shared/auth/hooks/useAuthUser';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: 'Principal',
    items: [
      { label: 'Tableau de bord', href: ROUTES.admin.dashboard, icon: BarChart3 },
      { label: 'Évènement', href: ROUTES.admin.events, icon: CalendarDays },
    ],
  },
  {
    title: 'Gestion',
    items: [
      { label: 'Réservations', href: ROUTES.admin.bookings, icon: Ticket },
      { label: 'Participants', href: ROUTES.admin.participants, icon: Users },
      { label: 'Scan & Billetterie', href: ROUTES.admin.scan, icon: ScanLine },
      { label: 'Certificats', href: ROUTES.admin.certificates, icon: Award },
      { label: 'Avis', href: ROUTES.admin.feedback, icon: MessageSquare },
      { label: 'Publicités', href: ROUTES.admin.ads, icon: Megaphone },
    ],
  },
  {
    title: 'Système',
    items: [
      { label: 'Utilisateurs', href: ROUTES.admin.users, icon: UserCog },
      { label: 'Paramètres', href: ROUTES.admin.settings, icon: Settings },
    ],
  },
];

interface SidebarProps {
  /** Ouverture du drawer mobile (ignoré en ≥ lg où la sidebar est fixe). */
  open?: boolean;
  /** Fermeture du drawer (clic lien / déconnexion sur mobile). */
  onClose?: () => void;
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuthUser();

  // N'affiche que les entrées autorisées par les permissions du compte.
  // super_admin voit tout (cf. hasPermission). Tant que la session n'est pas lue,
  // `user` est null → on masque les entrées à permission (évite un flash).
  const sections = SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) =>
      hasPermission(user, ROUTE_PERMISSIONS[item.href] ?? null),
    ),
  })).filter((section) => section.items.length > 0);

  return (
    <aside
      aria-label="Navigation admin"
      className={cn(
        'flex w-64 shrink-0 flex-col bg-brand-navy text-white',
        // Mobile : drawer off-canvas. Desktop (≥ lg) : sticky pleine hauteur, logout toujours visible.
        'fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:z-auto lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <Link href={ROUTES.admin.dashboard} aria-label="Accueil admin" className="rounded-lg bg-white/95 px-2 py-1">
          <Logo size={32} />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-7 overflow-y-auto px-4 py-6">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-white/40">
              {section.title}
            </p>
            <ul className="mt-3 space-y-1">
              {section.items.map(({ label, href, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onClose}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-white/10 text-brand-gold'
                          : 'text-white/80 hover:bg-white/5 hover:text-white',
                      )}
                    >
                      <Icon className="size-4 shrink-0" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Pied de sidebar — retour au site public (sans déconnexion). */}
      <div className="shrink-0 border-t border-white/10 p-4">
        <Link
          href={ROUTES.public.home}
          onClick={onClose}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
        >
          <Home className="size-4 shrink-0" />
          Retour à l&apos;accueil
        </Link>
      </div>
    </aside>
  );
}
