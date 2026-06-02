/**
 * Service users — logique métier de la gestion des comptes administrateurs
 * et de l'attribution des fonctionnalités (permissions).
 *
 * Garde-fous anti-escalade :
 *  - Seul un `super_admin` peut créer/modifier un compte `super_admin`.
 *  - Seul un `super_admin` peut attribuer la permission `users:manage`.
 *  - Un acteur ne peut ni se désactiver lui-même ni se retirer son propre rôle
 *    `super_admin` (évite le verrouillage hors du système).
 */

import bcrypt from 'bcryptjs';
import { UsersRepository } from '../repositories/users.repository';
import { PERMISSIONS } from '../types/users.types';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../../shared/errors/types/error.types';
import { logAudit } from '../../shared/audit/services/audit.service';
import type {
  CreateUserInput,
  UpdateUserInput,
  SetPermissionsInput,
  ResetPasswordInput,
} from '../validators/users.validator';

const BCRYPT_ROUNDS = 12;

interface Actor {
  userId: string;
  role: string;
}

export class UsersService {
  private readonly repository = new UsersRepository();

  private isSuperAdmin(actor: Actor): boolean {
    return actor.role === 'super_admin';
  }

  async list(params: { page?: number; limit?: number; role?: string }) {
    return this.repository.findAll(params);
  }

  async create(actor: Actor, data: CreateUserInput) {
    if (data.role === 'super_admin' && !this.isSuperAdmin(actor)) {
      throw new ForbiddenError('Seul un super_admin peut créer un super_admin');
    }
    this.guardPermissionGrant(actor, data.permissions);

    const existing = await this.repository.findByEmail(data.email);
    if (existing) throw new ConflictError('Un compte avec cet email existe déjà');

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    const user = await this.repository.create({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      // super_admin : permissions implicites → on stocke un tableau vide.
      permissions: data.role === 'super_admin' ? [] : data.permissions,
    });

    await logAudit({
      action: 'USER_CREATED',
      userId: actor.userId,
      resource: 'admin',
      resourceId: user.id,
      details: { role: user.role, permissions: user.permissions },
      result: 'success',
    });
    return user;
  }

  async update(actor: Actor, data: UpdateUserInput) {
    const target = await this.repository.findPublicById(data.id);
    if (!target) throw new NotFoundError('Utilisateur');

    // Modifier un super_admin nécessite d'être super_admin.
    if (target.role === 'super_admin' && !this.isSuperAdmin(actor)) {
      throw new ForbiddenError('Seul un super_admin peut modifier un super_admin');
    }
    // Promouvoir vers super_admin nécessite d'être super_admin.
    if (data.role === 'super_admin' && !this.isSuperAdmin(actor)) {
      throw new ForbiddenError('Seul un super_admin peut promouvoir en super_admin');
    }

    // Anti-verrouillage : ne pas se désactiver / se rétrograder soi-même.
    if (data.id === actor.userId) {
      if (data.isActive === false) {
        throw new ValidationError('Impossible de désactiver votre propre compte');
      }
      if (data.role && data.role !== actor.role) {
        throw new ValidationError('Impossible de modifier votre propre rôle');
      }
    }

    const patch: Record<string, unknown> = {};
    if (data.firstName !== undefined) patch.firstName = data.firstName;
    if (data.lastName !== undefined) patch.lastName = data.lastName;
    if (data.isActive !== undefined) patch.isActive = data.isActive;
    if (data.role !== undefined) {
      patch.role = data.role;
      // En passant super_admin, les permissions explicites n'ont plus de sens.
      if (data.role === 'super_admin') patch.permissions = [];
    }

    const user = await this.repository.update(data.id, patch);
    await logAudit({
      action: 'USER_UPDATED',
      userId: actor.userId,
      resource: 'admin',
      resourceId: user.id,
      details: { changes: Object.keys(patch) },
      result: 'success',
    });
    return user;
  }

  async setPermissions(actor: Actor, data: SetPermissionsInput) {
    const target = await this.repository.findPublicById(data.id);
    if (!target) throw new NotFoundError('Utilisateur');

    if (target.role === 'super_admin') {
      throw new ValidationError(
        'Un super_admin possède déjà toutes les permissions',
      );
    }
    this.guardPermissionGrant(actor, data.permissions);

    const user = await this.repository.update(data.id, {
      permissions: data.permissions,
    });
    await logAudit({
      action: 'USER_PERMISSIONS_UPDATED',
      userId: actor.userId,
      resource: 'admin',
      resourceId: user.id,
      details: { permissions: data.permissions },
      result: 'success',
    });
    return user;
  }

  async setActive(actor: Actor, id: string, isActive: boolean) {
    return this.update(actor, { id, isActive });
  }

  async resetPassword(actor: Actor, data: ResetPasswordInput) {
    const target = await this.repository.findPublicById(data.id);
    if (!target) throw new NotFoundError('Utilisateur');
    if (target.role === 'super_admin' && !this.isSuperAdmin(actor)) {
      throw new ForbiddenError(
        'Seul un super_admin peut réinitialiser le mot de passe d\'un super_admin',
      );
    }
    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    await this.repository.update(data.id, { passwordHash });
    await logAudit({
      action: 'USER_PASSWORD_RESET',
      userId: actor.userId,
      resource: 'admin',
      resourceId: data.id,
      result: 'success',
    });
    return { id: data.id };
  }

  /**
   * Empêche un acteur non super_admin d'attribuer `users:manage`
   * (sinon un admin pourrait s'auto-octroyer un pouvoir d'escalade).
   */
  private guardPermissionGrant(actor: Actor, permissions: string[]): void {
    if (
      permissions.includes(PERMISSIONS.USERS_MANAGE) &&
      !this.isSuperAdmin(actor)
    ) {
      throw new ForbiddenError(
        'Seul un super_admin peut attribuer la gestion des utilisateurs',
      );
    }
  }
}
