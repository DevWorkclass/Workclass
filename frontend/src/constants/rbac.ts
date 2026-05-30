/**
 * RBAC — Mapping rôles → permissions.
 * À utiliser via `hasPermission(role, permission)`.
 */

import { UserRole } from '@/domains/shared/auth/types/auth.types';
import { PERMISSIONS, type Permission } from '@/constants/permissions';

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  [UserRole.PUBLIC]: PERMISSIONS.public,
  [UserRole.ADMIN]: PERMISSIONS.admin,
  [UserRole.SUPER_ADMIN]: PERMISSIONS.super_admin,
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
