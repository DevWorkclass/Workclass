/**
 * Service JWT — sign/verify avec HS256.
 * STUB v1 : à implémenter avec `jsonwebtoken` en ÉTAPE 2.
 */
import type { AdminUser, JwtPayload } from '../types/auth.types.js';

export const jwtService = {
  sign(_user: AdminUser): string {
    throw new Error('Not implemented — ÉTAPE 2 backend');
  },
  verify(_token: string): JwtPayload {
    throw new Error('Not implemented — ÉTAPE 2 backend');
  },
};
