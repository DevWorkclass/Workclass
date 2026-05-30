import type { Request, Response, NextFunction } from 'express';
import {
  feedbackSubmitSchema,
  feedbackValidateSchema,
} from '../validators/feedback.validator.js';
import { feedbackService } from '../services/feedback.service.js';

export const feedbackController = {
  async validate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = feedbackValidateSchema.parse(req.body);
      const link = await feedbackService.validate(input);
      if (!link) {
        res.status(404).json({
          success: false,
          error: { code: 'invalid_token', message: 'Lien invalide ou expiré' },
        });
        return;
      }
      res.json({ success: true, data: { eventId: link.eventId } });
    } catch (err) {
      next(err);
    }
  },

  async submit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = feedbackSubmitSchema.parse(req.body);
      const response = await feedbackService.submit(input);
      res.status(201).json({ success: true, data: response });
    } catch (err) {
      next(err);
    }
  },
};
