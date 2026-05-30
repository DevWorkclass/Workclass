import type { Request, Response, NextFunction } from 'express';
import { scanConfirmSchema, scanVerifySchema } from '../validators/scan.validator.js';
import { scanService } from '../services/scan.service.js';

export const scanController = {
  async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = scanVerifySchema.parse(req.body);
      const result = await scanService.verify(input);
      res.json({ success: result.valid, data: result });
    } catch (err) {
      next(err);
    }
  },

  async confirm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = scanConfirmSchema.parse(req.body);
      const result = await scanService.confirm(input);
      res.json({ success: result.valid, data: result });
    } catch (err) {
      next(err);
    }
  },
};
