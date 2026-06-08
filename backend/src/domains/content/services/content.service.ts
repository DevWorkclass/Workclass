/**
 * Service content — lit/écrit le contenu éditable du site (table `site_settings`).
 */

import { prisma } from '../../../config/database';
import { uploadImage } from '../../shared/storage/storage.service';
import { logAudit } from '../../shared/audit/services/audit.service';
import { ValidationError } from '../../shared/errors/types/error.types';
import {
  DEFAULT_APP_CONFIG,
  DEFAULT_HOME_THEMES,
  APP_CONFIG_KEY,
  HOME_THEMES_KEY,
  PARTNERS_KEY,
  type AppConfig,
  type HomeTheme,
  type Partner,
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

  /** Téléverse une image générique (logo partenaire, etc.). */
  async uploadAnyImage(file: { buffer: Buffer; mimetype: string }): Promise<string> {
    const ext = ALLOWED_IMAGE_TYPES[file.mimetype];
    if (!ext) {
      throw new ValidationError('Type d\'image non supporté (png, jpg, webp, gif).');
    }
    const filename = `img-${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`;
    return uploadImage(filename, file.buffer, file.mimetype);
  }

  /** Logos partenaires (page d'accueil). */
  async getPartners(): Promise<Partner[]> {
    const row = await prisma.siteSetting.findUnique({ where: { key: PARTNERS_KEY } });
    return row ? (row.value as unknown as Partner[]) : [];
  }

  async setPartners(partners: Partner[], userId?: string): Promise<Partner[]> {
    const clean = partners.map((p) => ({
      name: p.name,
      logoUrl: p.logoUrl || undefined,
      description: p.description || undefined,
    }));
    await prisma.siteSetting.upsert({
      where: { key: PARTNERS_KEY },
      create: { key: PARTNERS_KEY, value: clean as unknown as object },
      update: { value: clean as unknown as object },
    });
    await logAudit({
      action: 'CONTENT_PARTNERS_UPDATE',
      userId,
      resource: 'site_setting',
      resourceId: PARTNERS_KEY,
      details: { count: clean.length },
      result: 'success',
    });
    return clean;
  }

  /** Configuration du dynamisme de l'app. */
  async getAppConfig(): Promise<AppConfig> {
    const row = await prisma.siteSetting.findUnique({ where: { key: APP_CONFIG_KEY } });
    return row ? { ...DEFAULT_APP_CONFIG, ...(row.value as object) } : DEFAULT_APP_CONFIG;
  }

  async setAppConfig(config: AppConfig, userId?: string): Promise<AppConfig> {
    await prisma.siteSetting.upsert({
      where: { key: APP_CONFIG_KEY },
      create: { key: APP_CONFIG_KEY, value: config as unknown as object },
      update: { value: config as unknown as object },
    });
    await logAudit({
      action: 'CONTENT_APP_CONFIG_UPDATE',
      userId,
      resource: 'site_setting',
      resourceId: APP_CONFIG_KEY,
      result: 'success',
    });
    return config;
  }

  /**
   * Témoignages publics : avis approuvés avec commentaire, anonymisés
   * (prénom + initiale du nom). Pour le carrousel de la page d'accueil.
   */
  async getTestimonials(): Promise<{ name: string; event: string; comment: string; rating: number }[]> {
    const responses = await prisma.feedbackResponse.findMany({
      where: { moderationStatus: 'approved', comment: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        event: { select: { title: true } },
        feedbackLink: {
          include: { booking: { include: { participant: { select: { firstName: true, lastName: true } } } } },
        },
      },
    });

    return responses
      .filter((r) => r.comment && r.comment.trim().length > 0)
      .map((r) => {
        const p = r.feedbackLink?.booking?.participant;
        const name = p ? `${p.firstName} ${p.lastName.charAt(0)}.` : 'Participant';
        const ratings = r.ratings as Record<string, number>;
        const values = Object.values(ratings).filter((v) => typeof v === 'number');
        const rating = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 5;
        return { name, event: r.event.title, comment: r.comment as string, rating };
      });
  }
}
