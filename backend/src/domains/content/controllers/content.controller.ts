/**
 * Contrôleur content.
 *  - GET  /content/home-themes        : public (contenu non sensible).
 *  - POST /admin/content/home-themes  : enregistre les domaines (guard content:manage).
 *  - POST /admin/content/upload-image : upload image (multipart, guard content:manage).
 */

import type { Request, Response, NextFunction } from 'express';
import { ContentService } from '../services/content.service';
import { setHomeThemesSchema } from '../validators/content.validator';
import { ValidationError } from '../../shared/errors/types/error.types';

export class ContentController {
  private readonly service = new ContentService();

  async getHomeThemes(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const themes = await this.service.getHomeThemes();
      res.json({ success: true, data: themes });
    } catch (error) {
      next(error);
    }
  }

  async setHomeThemes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = setHomeThemesSchema.parse(req.body);
      const themes = await this.service.setHomeThemes(parsed, req.user?.userId);
      res.json({ success: true, data: themes });
    } catch (error) {
      next(error);
    }
  }

  async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = req.file;
      if (!file) throw new ValidationError('Aucun fichier reçu (champ « image »).');
      const url = await this.service.uploadThemeImage({
        buffer: file.buffer,
        mimetype: file.mimetype,
      });
      res.json({ success: true, data: { url } });
    } catch (error) {
      next(error);
    }
  }
}
