/**
 * Service content — lit/écrit le contenu éditable du site (table `site_settings`).
 */

import { prisma } from '../../../config/database';
import { uploadImage } from '../../shared/storage/storage.service';
import { logAudit } from '../../shared/audit/services/audit.service';
import { ValidationError } from '../../shared/errors/types/error.types';
import {
  DEFAULT_HOME_THEMES,
  HOME_THEMES_KEY,
  type HomeTheme,
} from '../types/content.types';
import type { SetHomeThemesInput } from '../validators/content.validator';

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export class ContentService {
  /** Renvoie les domaines personnalisés, ou les valeurs par défaut si absents. */
  async getHomeThemes(): Promise<HomeTheme[]> {
    const row = await prisma.siteSetting.findUnique({ where: { key: HOME_THEMES_KEY } });
    if (!row) return DEFAULT_HOME_THEMES;
    return row.value as unknown as HomeTheme[];
  }

  /** Enregistre (upsert) la liste des domaines. */
  async setHomeThemes(input: SetHomeThemesInput, userId?: string): Promise<HomeTheme[]> {
    const themes: HomeTheme[] = input.themes.map((t) => ({
      icon: t.icon,
      title: t.title,
      description: t.description,
      imageUrl: t.imageUrl || undefined,
    }));

    await prisma.siteSetting.upsert({
      where: { key: HOME_THEMES_KEY },
      create: { key: HOME_THEMES_KEY, value: themes as unknown as object },
      update: { value: themes as unknown as object },
    });

    await logAudit({
      action: 'CONTENT_HOME_THEMES_UPDATE',
      userId,
      resource: 'site_setting',
      resourceId: HOME_THEMES_KEY,
      details: { count: themes.length },
      result: 'success',
    });

    return themes;
  }

  /**
   * Téléverse une image et renvoie son URL publique.
   * Valide le type MIME (images uniquement).
   */
  async uploadThemeImage(file: { buffer: Buffer; mimetype: string }): Promise<string> {
    const ext = ALLOWED_IMAGE_TYPES[file.mimetype];
    if (!ext) {
      throw new ValidationError('Type d\'image non supporté (png, jpg, webp, gif).');
    }
    const filename = `domaine-${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`;
    return uploadImage(filename, file.buffer, file.mimetype);
  }
}
