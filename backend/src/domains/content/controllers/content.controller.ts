/**
 * Contrôleur content.
 *  - GET  /content/home-themes        : public (contenu non sensible).
 *  - POST /admin/content/home-themes  : enregistre les domaines (guard content:manage).
 *  - POST /admin/content/upload-image : upload image (multipart, guard content:manage).
 */

import type { Request, Response, NextFunction } from 'express';
import { ContentService } from '../services/content.service';
import {
  setHomeThemesSchema,
  setPartnersSchema,
  setAppConfigSchema,
  setIndustriesSchema,
  setFooterSchema,
  setPaymentConfigSchema,
  setSupportConfigSchema,
} from '../validators/content.validator';
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
      const url = await this.service.uploadAnyImage({
        buffer: file.buffer,
        mimetype: file.mimetype,
      });
      res.json({ success: true, data: { url } });
    } catch (error) {
      next(error);
    }
  }

  async getPartners(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({ success: true, data: await this.service.getPartners() });
    } catch (error) {
      next(error);
    }
  }

  async setPartners(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { partners } = setPartnersSchema.parse(req.body);
      const saved = await this.service.setPartners(partners, req.user?.userId);
      res.json({ success: true, data: saved });
    } catch (error) {
      next(error);
    }
  }

  async getAppConfig(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({ success: true, data: await this.service.getAppConfig() });
    } catch (error) {
      next(error);
    }
  }

  async setAppConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = setAppConfigSchema.parse(req.body);
      const saved = await this.service.setAppConfig(config, req.user?.userId);
      res.json({ success: true, data: saved });
    } catch (error) {
      next(error);
    }
  }

  async getTestimonials(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({ success: true, data: await this.service.getTestimonials() });
    } catch (error) {
      next(error);
    }
  }

  async getIndustries(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({ success: true, data: await this.service.getIndustries() });
    } catch (error) {
      next(error);
    }
  }

  async setIndustries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { industries } = setIndustriesSchema.parse(req.body);
      const saved = await this.service.setIndustries(industries, req.user?.userId);
      res.json({ success: true, data: saved });
    } catch (error) {
      next(error);
    }
  }

  async getFooter(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({ success: true, data: await this.service.getFooter() });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentConfig(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({ success: true, data: await this.service.getPaymentConfig() });
    } catch (error) {
      next(error);
    }
  }

  async setPaymentConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = setPaymentConfigSchema.parse(req.body);
      const saved = await this.service.setPaymentConfig(config, req.user?.userId);
      res.json({ success: true, data: saved });
    } catch (error) {
      next(error);
    }
  }

  async getSupportConfig(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({ success: true, data: await this.service.getSupportConfig() });
    } catch (error) {
      next(error);
    }
  }

  async setSupportConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = setSupportConfigSchema.parse(req.body);
      const saved = await this.service.setSupportConfig(config, req.user?.userId);
      res.json({ success: true, data: saved });
    } catch (error) {
      next(error);
    }
  }

  async setFooter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const footer = setFooterSchema.parse(req.body);
      const saved = await this.service.setFooter(footer, req.user?.userId);
      res.json({ success: true, data: saved });
    } catch (error) {
      next(error);
    }
  }
}
