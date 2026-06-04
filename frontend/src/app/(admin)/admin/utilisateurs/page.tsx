'use client';

/**
 * Admin — Utilisateurs (comptes administrateurs). Données mock.
 */
import { useMemo, useState } from 'react';

import { Badge } from '@/components/admin/Badge';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Button } from '@/components/ui/button';
import { ADMIN_USERS } from '@/data/adminMockData';

const ROLE_LABEL: Record<string, { label: string; tone: 'warning' | 'success' | 'info' }> = {
  super_admin: { label: 'Super Admin', tone: 'warning' },
  manager: { label: 'Manager', tone: 'success' },
  scanner: { label: 'Scanner', tone: 'info' },
};

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function AdminUsersPage() {
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ADMIN_USERS;
    return ADMIN_USERS.filter((u) =>
      [u.name, u.email].some((v) => v.toLowerCase().includes(q)),
    );
  }, [query]);

  const counts = {
    superAdmins: ADMIN_USERS.filter((u) => u.role === 'super_admin').length,
    managers: ADMIN_USERS.filter((u) => u.role === 'manager').length,
    scanners: ADMIN_USERS.filter((u) => u.role === 'scanner').length,
  };

  return (
    <>
      <PageHeader
        title="Utilisateurs"
        subtitle="Gestion des accès administrateurs"
        actions={
          <Button variant="gold" size="sm">
            + Ajouter un compte
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Super Admins" value={counts.superAdmins} accent="gold" />
        <StatCard label="Managers" value={counts.managers} accent="green" />
        <StatCard label="Scanners" value={counts.scanners} accent="blue" />
      </section>

      <section className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-brand-navy">Comptes administrateurs</h2>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher…"
            aria-label="Rechercher un utilisateur"
            className="w-64 max-w-full rounded-full border border-black/10 bg-brand-cream px-4 py-2 text-sm text-brand-navy placeholder:text-brand-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-brand-muted">
                <th className="pb-3 font-semibold">Utilisateur</th>
                <th className="pb-3 font-semibold">Email</th>
                <th className="pb-3 font-semibold">Rôle</th>
                <th className="pb-3 font-semibold">Dernière connexion</th>
                <th className="pb-3 font-semibold">Statut</th>
                <th className="pb-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const role = ROLE_LABEL[u.role] ?? { label: u.role, tone: 'neutral' as const };
                return (
                  <tr key={u.email} className="border-t border-black/5">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-full bg-brand-navy text-xs font-bold text-white">
                          {initials(u.name)}
                        </span>
                        <span className="font-semibold text-brand-navy">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-brand-muted">{u.email}</td>
                    <td className="py-3">
                      <Badge tone={role.tone}>{role.label}</Badge>
                    </td>
                    <td className="py-3 text-brand-navy">{u.lastLogin}</td>
                    <td className="py-3">
                      {u.active ? (
                        <Badge tone="success" dot>
                          Actif
                        </Badge>
                      ) : (
                        <Badge tone="neutral">Inactif</Badge>
                      )}
                    </td>
                    <td className="py-3">
                      <Button variant="outline" size="sm">
                        {u.role === 'super_admin' ? 'Permissions' : u.active ? 'Modifier' : 'Activer'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
