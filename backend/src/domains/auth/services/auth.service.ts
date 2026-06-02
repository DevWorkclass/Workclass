/**
 * Service auth — authentification des comptes administrateurs.
 *  - login : vérifie email + mot de passe (bcrypt), renvoie tokens + profil.
 *  - refresh : régénère un access token à partir d'un refresh token valide.
 *
 * La réponse inclut les permissions effectives (super_admin → toutes implicitement,
 * résolu côté backend ; ici on renvoie le tableau brut + le rôle).
 */

import bcrypt from 'bcryptjs';
import { UsersRepository } from '../../users/repositories/users.repository';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../shared/auth/services/jwt.service';
import { UnauthorizedError } from '../../shared/errors/types/error.types';
import { logAudit } from '../../shared/audit/services/audit.service';
import type { LoginInput } from '../validators/auth.validator';

export class AuthService {
  private readonly users = new UsersRepository();

  async login(data: LoginInput, ctx?: { ip?: string; userAgent?: string }) {
    const account = await this.users.findByEmail(data.email);
    // Message générique (pas de fuite : email existant ou non).
    const invalid = new UnauthorizedError('Identifiants invalides');

    if (!account || !account.isActive) {
      await logAudit({
        action: 'AUTH_LOGIN',
        resource: 'admin',
        details: { reason: account ? 'inactive' : 'unknown_email' },
        ip: ctx?.ip,
        userAgent: ctx?.userAgent,
        result: 'failure',
      });
      throw invalid;
    }

    const ok = await bcrypt.compare(data.password, account.passwordHash);
    if (!ok) {
      await logAudit({
        action: 'AUTH_LOGIN',
        userId: account.id,
        resource: 'admin',
        details: { reason: 'bad_password' },
        ip: ctx?.ip,
        userAgent: ctx?.userAgent,
        result: 'failure',
      });
      throw invalid;
    }

    await this.users.touchLastLogin(account.id);
    const payload = { userId: account.id, email: account.email, role: account.role };

    await logAudit({
      action: 'AUTH_LOGIN',
      userId: account.id,
      resource: 'admin',
      ip: ctx?.ip,
      userAgent: ctx?.userAgent,
      result: 'success',
    });

    return {
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
      user: {
        id: account.id,
        email: account.email,
        firstName: account.firstName,
        lastName: account.lastName,
        role: account.role,
        permissions: account.permissions,
        isActive: account.isActive,
      },
    };
  }

  async refresh(refreshToken: string) {
    const decoded = verifyRefreshToken(refreshToken);
    // Re-valide l'état du compte (désactivé / supprimé entre-temps).
    const account = await this.users.findByIdRaw(decoded.userId);
    if (!account || !account.isActive) {
      throw new UnauthorizedError('Compte inactif');
    }
    const payload = { userId: account.id, email: account.email, role: account.role };
    return {
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload),
    };
  }

  async me(userId: string) {
    const account = await this.users.findPublicById(userId);
    if (!account) throw new UnauthorizedError('Compte introuvable');
    return account;
  }
}
