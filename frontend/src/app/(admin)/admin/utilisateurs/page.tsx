'use client';

/**
 * Admin — Utilisateurs (comptes administrateurs). Branché backend.
 *  - Liste réelle  : GET  /api/admin/users
 *  - Catalogue     : GET  /api/admin/users/permissions
 *  - Attribution   : POST /api/admin/users/permissions  body { id, permissions }
 *
 * Modèle : rôles `admin` | `super_admin` uniquement. Un super_admin possède toutes
 * les permissions implicitement (édition masquée, cohérent avec le refus backend).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Badge, type BadgeTone } from '@/components/admin/Badge';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ROUTES } from '@/constants/routes';
import type { Permission, PermissionCatalogItem } from '@/constants/permissions';
import { PermissionGuard } from '@/components/admin/PermissionGuard';
import { ApiError, apiAuth } from '@/lib/api';

interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'admin' | 'super_admin';
  permissions: Permission[];
  isActive: boolean;
  lastLoginAt: string | null;
}

const ROLE_LABEL: Record<AdminUser['role'], { label: string; tone: BadgeTone }> = {
  super_admin: { label: 'Super Admin', tone: 'warning' },
  admin: { label: 'Admin', tone: 'info' },
};

function fullName(u: AdminUser): string {
  const name = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  return name || u.email;
}

function initials(label: string): string {
  return label
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatLastLogin(iso: string | null): string {
  if (!iso) return 'Jamais';
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function AdminUsersPage() {
  return (
    <PermissionGuard permission="users:manage">
      <UsersContent />
    </PermissionGuard>
  );
}

function UsersContent() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [catalog, setCatalog] = useState<PermissionCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleAuthError = useCallback(
    (err: unknown): boolean => {
      if (err instanceof ApiError && err.status === 401) {
        router.replace(ROUTES.admin.login);
        return true;
      }
      return false;
    },
    [router],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersRes, catalogRes] = await Promise.all([
        apiAuth<{ data: AdminUser[] }>('/admin/users?limit=100'),
        apiAuth<{ data: PermissionCatalogItem[] }>('/admin/users/permissions'),
      ]);
      setUsers(usersRes.data);
      setCatalog(catalogRes.data);
    } catch (err) {
      if (handleAuthError(err)) return;
      setError('Chargement impossible. Vérifiez votre connexion et réessayez.');
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [fullName(u), u.email].some((v) => v.toLowerCase().includes(q)),
    );
  }, [query, users]);

  const counts = {
    superAdmins: users.filter((u) => u.role === 'super_admin').length,
    admins: users.filter((u) => u.role === 'admin').length,
  };

  function handleSaved(updated: AdminUser) {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    setEditing(null);
  }

  async function toggleActive(u: AdminUser) {
    try {
      setBusyId(u.id);
      const action = u.isActive ? 'deactivate' : 'activate';
      const res = await apiAuth<{ data: AdminUser }>(`/admin/users/${action}`, {
        method: 'POST',
        body: JSON.stringify({ id: u.id }),
      });
      handleSaved(res.data);
    } catch (err) {
      if (!handleAuthError(err)) setError("L'action a échoué.");
    } finally {
      setBusyId(null);
    }
  }

  async function resetPassword(u: AdminUser) {
    const password = window.prompt(
      `Nouveau mot de passe pour ${fullName(u)} (10 caractères min) :`,
    );
    if (!password) return;
    if (password.length < 10) {
      setError('Mot de passe trop court (10 caractères minimum).');
      return;
    }
    try {
      setBusyId(u.id);
      setError(null);
      await apiAuth('/admin/users/password', {
        method: 'POST',
        body: JSON.stringify({ id: u.id, password }),
      });
      window.alert('Mot de passe réinitialisé.');
    } catch (err) {
      if (!handleAuthError(err)) setError('Réinitialisation impossible.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Utilisateurs"
        subtitle="Gestion des accès administrateurs"
        actions={
          <Button variant="gold" size="sm" onClick={() => setCreating(true)}>
            + Ajouter un utilisateur
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Super Admins" value={counts.superAdmins} accent="gold" />
        <StatCard label="Admins" value={counts.admins} accent="blue" />
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

        {loading ? (
          <div className="flex justify-center py-12 text-brand-muted">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p role="alert" className="text-sm text-semantic-error">
              {error}
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => void load()}>
              Réessayer
            </Button>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            title="Aucun utilisateur"
            description="Aucun compte ne correspond à votre recherche."
          />
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-brand-muted">
                  <th className="pb-3 font-semibold">Utilisateur</th>
                  <th className="pb-3 font-semibold">Email</th>
                  <th className="pb-3 font-semibold">Rôle</th>
                  <th className="pb-3 font-semibold">Permissions</th>
                  <th className="pb-3 font-semibold">Dernière connexion</th>
                  <th className="pb-3 font-semibold">Statut</th>
                  <th className="pb-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => {
                  const role = ROLE_LABEL[u.role];
                  const name = fullName(u);
                  return (
                    <tr key={u.id} className="border-t border-black/5">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 place-items-center rounded-full bg-brand-navy text-xs font-bold text-white">
                            {initials(name)}
                          </span>
                          <span className="font-semibold text-brand-navy">{name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-brand-muted">{u.email}</td>
                      <td className="py-3">
                        <Badge tone={role.tone}>{role.label}</Badge>
                      </td>
                      <td className="py-3 text-brand-muted">
                        {u.role === 'super_admin'
                          ? 'Toutes (implicite)'
                          : `${u.permissions.length} / ${catalog.length}`}
                      </td>
                      <td className="py-3 text-brand-navy">{formatLastLogin(u.lastLoginAt)}</td>
                      <td className="py-3">
                        {u.isActive ? (
                          <Badge tone="success" dot>
                            Actif
                          </Badge>
                        ) : (
                          <Badge tone="neutral">Inactif</Badge>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={u.role === 'super_admin'}
                            onClick={() => setEditing(u)}
                          >
                            Permissions
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busyId === u.id}
                            onClick={() => void toggleActive(u)}
                          >
                            {u.isActive ? 'Désactiver' : 'Activer'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busyId === u.id}
                            onClick={() => void resetPassword(u)}
                          >
                            Mot de passe
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing ? (
        <PermissionsModal
          user={editing}
          catalog={catalog}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
          onAuthError={handleAuthError}
        />
      ) : null}

      {creating ? (
        <CreateUserModal
          catalog={catalog}
          onClose={() => setCreating(false)}
          onCreated={(u) => {
            setUsers((prev) => [u, ...prev]);
            setCreating(false);
          }}
          onAuthError={handleAuthError}
        />
      ) : null}
    </>
  );
}

interface CreateUserModalProps {
  catalog: PermissionCatalogItem[];
  onClose: () => void;
  onCreated: (u: AdminUser) => void;
  onAuthError: (err: unknown) => boolean;
}

function CreateUserModal({ catalog, onClose, onCreated, onAuthError }: CreateUserModalProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'super_admin'>('admin');
  const [selected, setSelected] = useState<Set<Permission>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(key: Permission) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleCreate() {
    if (!email.trim() || password.length < 10) {
      setError('Email valide et mot de passe (10 caractères min) requis.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await apiAuth<{ data: AdminUser }>('/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email: email.trim(),
          password,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          role,
          permissions: role === 'super_admin' ? [] : [...selected],
        }),
      });
      onCreated(res.data);
    } catch (err) {
      if (onAuthError(err)) return;
      setError(
        err instanceof ApiError && err.status === 409
          ? 'Un compte existe déjà avec cet email.'
          : "Création impossible (vérifiez les champs).",
      );
      setSaving(false);
    }
  }

  const inputClass =
    'mt-1 w-full rounded-lg border border-black/10 bg-brand-cream px-3 py-2 text-sm text-brand-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Nouvel utilisateur"
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-brand-navy">Nouvel utilisateur</h2>

        <fieldset className="mt-4 space-y-3" disabled={saving}>
          <label className="block text-sm">
            <span className="font-semibold text-brand-navy">Email *</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="font-semibold text-brand-navy">Prénom</span>
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="font-semibold text-brand-navy">Nom</span>
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputClass} />
            </label>
          </div>
          <label className="block text-sm">
            <span className="font-semibold text-brand-navy">Mot de passe * (10 car. min)</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-brand-navy">Rôle</span>
            <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'super_admin')} className={inputClass}>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </label>

          {role === 'admin' && (
            <div>
              <span className="text-sm font-semibold text-brand-navy">Permissions</span>
              <div className="mt-2 space-y-1.5">
                {catalog.map((perm) => (
                  <label key={perm.key} className="flex cursor-pointer items-center gap-3 rounded-lg border border-black/5 px-3 py-1.5 hover:bg-brand-cream">
                    <input type="checkbox" checked={selected.has(perm.key)} onChange={() => toggle(perm.key)} className="size-4 accent-brand-gold" />
                    <span className="text-sm text-brand-navy">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </fieldset>

        {error ? <p role="alert" className="mt-3 text-sm text-semantic-error">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" size="sm" disabled={saving} onClick={onClose}>
            Annuler
          </Button>
          <Button variant="gold" size="sm" disabled={saving} onClick={() => void handleCreate()}>
            {saving ? 'Création…' : 'Créer'}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface PermissionsModalProps {
  user: AdminUser;
  catalog: PermissionCatalogItem[];
  onClose: () => void;
  onSaved: (u: AdminUser) => void;
  onAuthError: (err: unknown) => boolean;
}

function PermissionsModal({
  user,
  catalog,
  onClose,
  onSaved,
  onAuthError,
}: PermissionsModalProps) {
  const [selected, setSelected] = useState<Set<Permission>>(
    () => new Set(user.permissions),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(key: Permission) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await apiAuth<{ data: AdminUser }>('/admin/users/permissions', {
        method: 'POST',
        body: JSON.stringify({ id: user.id, permissions: [...selected] }),
      });
      onSaved(res.data);
    } catch (err) {
      if (onAuthError(err)) return;
      setError('Enregistrement impossible. Réessayez.');
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Permissions de ${fullName(user)}`}
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-brand-navy">Permissions</h2>
        <p className="mt-1 text-sm text-brand-muted">{fullName(user)}</p>

        <fieldset className="mt-4 space-y-2" disabled={saving}>
          {catalog.map((perm) => (
            <label
              key={perm.key}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-black/5 px-3 py-2 hover:bg-brand-cream"
            >
              <input
                type="checkbox"
                checked={selected.has(perm.key)}
                onChange={() => toggle(perm.key)}
                className="size-4 accent-brand-gold"
              />
              <span className="text-sm text-brand-navy">{perm.label}</span>
            </label>
          ))}
        </fieldset>

        {error ? (
          <p role="alert" className="mt-3 text-sm text-semantic-error">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>
            Annuler
          </Button>
          <Button variant="gold" size="sm" onClick={() => void handleSave()} disabled={saving}>
            {saving ? <LoadingSpinner label="Enregistrement…" /> : 'Enregistrer'}
          </Button>
        </div>
      </div>
    </div>
  );
}
