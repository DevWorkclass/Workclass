/**
 * Contrôleur auth — login / refresh / me.
 */

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';
import { loginSchema, refreshSchema } from '../validators/auth.validator';
import { UnauthorizedError } from '../../shared/errors/types/error.types';

const updateProfileSchema = z.object({
  firstName: z.string().max(60).optional().or(z.literal('')),
  lastName: z.string().max(60).optional().or(z.literal('')),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z.string().min(8, 'Mot de passe trop court (8 caractères minimum)').max(200),
});

export class AuthController {
  private readonly service = new AuthService();

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = loginSchema.parse(req.body);
      const result = await this.service.login(data, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = refreshSchema.parse(req.body);
      const result = await this.service.refresh(refreshToken);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentification requise');
      const user = await this.service.me(req.user.userId);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  /** POST /auth/profile — met à jour prénom / nom du compte courant. */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentification requise');
      const parsed = updateProfileSchema.parse(req.body);
      const data = {
        firstName: parsed.firstName ? parsed.firstName : undefined,
        lastName: parsed.lastName ? parsed.lastName : undefined,
      };
      const user = await this.service.updateProfile(req.user.userId, data);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  /** POST /auth/password — change le mot de passe du compte courant. */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw new UnauthorizedError('Authentification requise');
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      const result = await this.service.changePassword(
        req.user.userId,
        currentPassword,
        newPassword,
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
