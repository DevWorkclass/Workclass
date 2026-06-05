'use client';

/**
 * Sidebar de navigation admin — marine, groupée par sections.
 * Met en évidence la route active via `usePathname`.
 */
import {
  BarChart3,
  CalendarDays,
  Home,
  LayoutGrid,
  LogOut,
  Megaphone,
  MessageSquare,
  ScanLine,
  Settings,
  Ticket,
  Users,
  UserCog,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';

import { ROUTES } from '@/constants/routes';
import { clearSession } from '@/lib/auth';
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

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    clearSession();
    router.push(ROUTES.admin.login);
  }

  return (
    <aside
      aria-label="Navigation admin"
      className="flex w-64 shrink-0 flex-col bg-brand-navy text-white"
    >
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <Link href={ROUTES.admin.dashboard} aria-label="Accueil admin">
          <LayoutGrid className="size-7 text-brand-gold" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-7 overflow-y-auto px-4 py-6">
        {SECTIONS.map((section) => (
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

      {/* Pied de sidebar — actions globales */}
      <div className="shrink-0 space-y-1 border-t border-white/10 p-4">
        <Link
          href={ROUTES.public.home}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
        >
          <Home className="size-4 shrink-0" />
          Retour à l&apos;accueil
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-semantic-error/70 transition-colors hover:bg-semantic-error/10 hover:text-semantic-error"
        >
          <LogOut className="size-4 shrink-0" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
