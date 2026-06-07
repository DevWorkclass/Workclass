/**
 * Permissions granulaires — MIROIR des clés backend.
 * Source de vérité unique : `backend/src/domains/users/types/users.types.ts`
 * (catalogue + libellés renvoyés par `GET /api/admin/users/permissions`).
 *
 * Modèle réel : un `admin` ne dispose que des permissions explicitement attribuées ;
 * un `super_admin` les possède toutes implicitement. Il n'existe PAS de mapping
 * statique rôle→permissions côté front (cf. suppression de `rbac.ts`).
 */

export const PERMISSION_KEYS = [
  'bookings:read',
  'bookings:write',
  'tickets:generate',
  'scan',
  'feedback:read',
  'feedback:moderate',
  'payments:manage',
  'users:manage',
] as const;

export type Permission = (typeof PERMISSION_KEYS)[number];

/** Entrée du catalogue renvoyée par l'API (clé + libellé FR). */
export interface PermissionCatalogItem {
  key: Permission;
  label: string;
}

/**
 * Permission requise pour accéder à chaque page admin.
 * `null` = page générale accessible à tout admin authentifié.
 * `super_admin` contourne tout (cf. `hasPermission`).
 * Clé = chemin de `ROUTES.admin.*`.
 */
export const ROUTE_PERMISSIONS: Record<string, Permission | null> = {
  '/admin/dashboard': null,
  '/admin/evenements': null,
  '/admin/reservations': 'bookings:read',
  '/admin/participants': 'bookings:read',
  '/admin/scan': 'scan',
  '/admin/avis': 'feedback:read',
  '/admin/publicites': null,
  '/admin/certificats': 'tickets:generate',
  '/admin/utilisateurs': 'users:manage',
  '/admin/parametres': null,
};
