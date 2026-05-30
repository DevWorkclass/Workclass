/**
 * Types du domaine `auth` (partagé).
 * Aligné avec admin_profiles + Supabase Auth.
 */

export enum UserRole {
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  PUBLIC = 'public',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

export interface AdminProfile {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole.ADMIN | UserRole.SUPER_ADMIN;
  isActive: boolean;
  lastLoginAt?: Date;
}

export interface AuthSession {
  userId: string;
  email: string;
  role: UserRole;
  expiresAt: Date;
}
