/**
 * Gestion de session admin côté client.
 *
 * SÉCURITÉ : le backend renvoie les tokens en JSON. On les conserve en
 * localStorage pour la v1 (simple, suffisant pour un back-office). Durcissement
 * recommandé : passer à des cookies httpOnly + SameSite=strict posés par le
 * backend (immunité XSS), ce qui nécessite une évolution côté API.
 */

export interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'admin' | 'super_admin';
  permissions: string[];
  isActive: boolean;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AdminUser;
}

const STORAGE_KEY = 'wcg.admin.session';

export function setSession(session: AuthSession): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/**
 * Vérifie qu'un compte possède une permission.
 *  - `super_admin` : possède TOUTES les permissions (implicite).
 *  - `admin` : uniquement les permissions explicitement attribuées.
 * `null` (route sans permission requise) → tout admin authentifié passe.
 * Aligné avec le backend (`requirePermission`).
 */
export function hasPermission(
  user: AdminUser | null,
  permission: string | null,
): boolean {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  if (permission === null) return true;
  return user.permissions.includes(permission);
}
