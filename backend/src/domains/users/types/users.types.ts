/**
 * Domaine users — gestion des comptes administrateurs et de leurs fonctionnalités.
 *
 * Modèle de permissions :
 *  - `super_admin` possède IMPLICITEMENT toutes les permissions (le tableau
 *    `permissions` en base est ignoré pour lui).
 *  - `admin` ne dispose que des permissions explicitement attribuées, modifiables
 *    à tout moment par un super_admin ou un admin ayant `users:manage`.
 */

/**
 * Catalogue des fonctionnalités attribuables.
 * La clé est le code stocké en base (`admins.permissions`).
 */
export const PERMISSIONS = {
  BOOKINGS_READ: 'bookings:read',
  BOOKINGS_WRITE: 'bookings:write',
  TICKETS_GENERATE: 'tickets:generate',
  SCAN: 'scan',
  FEEDBACK_READ: 'feedback:read',
  FEEDBACK_MODERATE: 'feedback:moderate',
  PAYMENTS_MANAGE: 'payments:manage',
  USERS_MANAGE: 'users:manage',
  CONTENT_MANAGE: 'content:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Liste plate de toutes les permissions valides (utilisée par la validation Zod). */
export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

/**
 * Métadonnées d'affichage pour le frontend (libellés FR).
 * Renvoyées par GET /api/admin/users/permissions.
 */
export const PERMISSION_CATALOG: { key: Permission; label: string }[] = [
  { key: PERMISSIONS.BOOKINGS_READ, label: 'Consulter les réservations' },
  { key: PERMISSIONS.BOOKINGS_WRITE, label: 'Valider / annuler les réservations' },
  { key: PERMISSIONS.TICKETS_GENERATE, label: 'Générer les billets' },
  { key: PERMISSIONS.SCAN, label: 'Scanner les billets (entrée)' },
  { key: PERMISSIONS.FEEDBACK_READ, label: 'Consulter les avis' },
  { key: PERMISSIONS.FEEDBACK_MODERATE, label: 'Modérer les avis' },
  { key: PERMISSIONS.PAYMENTS_MANAGE, label: 'Gérer les paiements' },
  { key: PERMISSIONS.USERS_MANAGE, label: 'Gérer les utilisateurs' },
  { key: PERMISSIONS.CONTENT_MANAGE, label: 'Gérer le contenu du site' },
];

/** Vue publique d'un compte admin (jamais de passwordHash). */
export interface AdminPublic {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  permissions: string[];
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}
