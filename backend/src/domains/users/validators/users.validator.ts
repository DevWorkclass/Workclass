/**
 * Schémas Zod du domaine users.
 */

import { z } from 'zod';
import { ALL_PERMISSIONS } from '../types/users.types';

const permissionEnum = z.enum(
  ALL_PERMISSIONS as [string, ...string[]],
  { errorMap: () => ({ message: 'Permission inconnue' }) },
);

const roleEnum = z.enum(['admin', 'super_admin']);

const passwordSchema = z
  .string()
  .min(10, 'Mot de passe trop court (10 caractères minimum)')
  .max(128, 'Mot de passe trop long');

export const createUserSchema = z.object({
  email: z.string().email('Email invalide'),
  password: passwordSchema,
  firstName: z.string().min(1).max(120).optional(),
  lastName: z.string().min(1).max(120).optional(),
  role: roleEnum.default('admin'),
  permissions: z.array(permissionEnum).default([]),
});

export const updateUserSchema = z.object({
  id: z.string().uuid('ID utilisateur invalide'),
  firstName: z.string().min(1).max(120).optional(),
  lastName: z.string().min(1).max(120).optional(),
  role: roleEnum.optional(),
  isActive: z.boolean().optional(),
});

export const setPermissionsSchema = z.object({
  id: z.string().uuid('ID utilisateur invalide'),
  permissions: z.array(permissionEnum),
});

export const userIdSchema = z.object({
  id: z.string().uuid('ID utilisateur invalide'),
});

export const resetPasswordSchema = z.object({
  id: z.string().uuid('ID utilisateur invalide'),
  password: passwordSchema,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type SetPermissionsInput = z.infer<typeof setPermissionsSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
