/**
 * Permissions granulaires par rôle.
 * Format `resource:action`. Étendable sans refonte de la matrice.
 */

export const PERMISSIONS = {
  admin: [
    'events:read',
    'events:write',
    'bookings:read',
    'bookings:write',
    'tickets:read',
    'tickets:write',
    'scan:execute',
    'feedback:read',
    'feedback:moderate',
    'participants:read',
    'participants:export',
  ],
  super_admin: [
    'events:read',
    'events:write',
    'events:delete',
    'bookings:read',
    'bookings:write',
    'bookings:delete',
    'tickets:read',
    'tickets:write',
    'scan:execute',
    'feedback:read',
    'feedback:moderate',
    'participants:read',
    'participants:export',
    'participants:anonymize',
    'admins:manage',
    'audit:read',
  ],
  public: ['events:read', 'booking:create', 'ticket:read'],
} as const;

export type Permission =
  | (typeof PERMISSIONS.admin)[number]
  | (typeof PERMISSIONS.super_admin)[number]
  | (typeof PERMISSIONS.public)[number];
