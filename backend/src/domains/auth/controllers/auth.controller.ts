/**
 * Contrôleur auth — login / refresh / me.
 */

import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { loginSchema, refreshSchema } from '../validators/auth.validator';
import { UnauthorizedError } from '../../shared/errors/types/error.types';

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
}
