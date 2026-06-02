/**
 * Contrôleur users — orchestration HTTP de la gestion des comptes admin.
 * Données sensibles (id, email, mot de passe) → POST + body JSON.
 */

import type { Request, Response, NextFunction } from 'express';
import { UsersService } from '../services/users.service';
import { PERMISSION_CATALOG } from '../types/users.types';
import {
  createUserSchema,
  updateUserSchema,
  setPermissionsSchema,
  userIdSchema,
  resetPasswordSchema,
} from '../validators/users.validator';
import { UnauthorizedError } from '../../shared/errors/types/error.types';

export class UsersController {
  private readonly service = new UsersService();

  private actor(req: Request) {
    if (!req.user) throw new UnauthorizedError('Authentification requise');
    return { userId: req.user.userId, role: req.user.role };
  }

  /** GET /admin/users/permissions — catalogue des fonctionnalités attribuables. */
  catalog(_req: Request, res: Response): void {
    res.json({ success: true, data: PERMISSION_CATALOG });
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(String(req.query.page ?? '1'), 10) || 1;
      const limit = parseInt(String(req.query.limit ?? '20'), 10) || 20;
      const role = req.query.role as string | undefined;
      const result = await this.service.list({ page, limit, role });
      res.json({
        success: true,
        data: result.users,
        meta: { total: result.total, page, limit },
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = createUserSchema.parse(req.body);
      const user = await this.service.create(this.actor(req), data);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = updateUserSchema.parse(req.body);
      const user = await this.service.update(this.actor(req), data);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async setPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = setPermissionsSchema.parse(req.body);
      const user = await this.service.setPermissions(this.actor(req), data);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = userIdSchema.parse(req.body);
      const user = await this.service.setActive(this.actor(req), id, false);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async activate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = userIdSchema.parse(req.body);
      const user = await this.service.setActive(this.actor(req), id, true);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = resetPasswordSchema.parse(req.body);
      const result = await this.service.resetPassword(this.actor(req), data);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
