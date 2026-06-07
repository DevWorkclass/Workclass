'use client';

/**
 * Menu profil + déconnexion (coin haut-droit du shell admin).
 * Affiche le compte connecté (initiales + nom/email) et permet de se déconnecter.
 */
import { LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { ROUTES } from '@/constants/routes';
import { clearSession } from '@/lib/auth';
import { useAuthUser } from '@/domains/shared/auth/hooks/useAuthUser';

function initials(label: string): string {
  return label
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function UserMenu() {
  const router = useRouter();
  const { user } = useAuthUser();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function handleLogout() {
    clearSession();
    router.replace(ROUTES.admin.login);
  }

  const name = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
    : '';
  const roleLabel = user?.role === 'super_admin' ? 'Super Admin' : 'Admin';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu du compte"
        className="flex items-center gap-2 rounded-full border border-black/5 bg-white py-1 pl-1 pr-3 text-sm shadow-sm hover:bg-brand-cream"
      >
        <span className="grid size-8 place-items-center rounded-full bg-brand-navy text-xs font-bold text-white">
          {name ? initials(name) : <User className="size-4" />}
        </span>
        <span className="hidden max-w-48 truncate font-semibold text-brand-navy sm:block">
          {name || 'Compte'}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-black/5 bg-white p-2 shadow-lg"
        >
          <div className="border-b border-black/5 px-3 py-2">
            <p className="truncate text-sm font-semibold text-brand-navy">{name || 'Compte'}</p>
            {user?.email ? (
              <p className="truncate text-xs text-brand-muted">{user.email}</p>
            ) : null}
            <p className="mt-1 text-xs font-medium text-brand-gold">{roleLabel}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-semantic-error hover:bg-semantic-error/10"
          >
            <LogOut className="size-4" />
            Déconnexion
          </button>
        </div>
      ) : null}
    </div>
  );
}
