import { z } from 'zod';

const themeIcon = z.enum(['briefcase', 'trending-up', 'lightbulb', 'rocket', 'globe']);

export const homeThemeSchema = z.object({
  icon: themeIcon,
  title: z.string().min(2, 'Titre requis').max(160),
  description: z.string().min(2, 'Description requise').max(400),
  imageUrl: z.string().url('URL image invalide').optional().or(z.literal('')),
  content: z.string().max(2000, 'Contenu trop long').optional().or(z.literal('')),
});

export const setHomeThemesSchema = z.object({
  themes: z.array(homeThemeSchema).min(1, 'Au moins un domaine').max(12),
});

export type SetHomeThemesInput = z.infer<typeof setHomeThemesSchema>;

export const partnerSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(120),
  logoUrl: z.string().url('URL logo invalide').optional().or(z.literal('')),
  description: z.string().max(300).optional().or(z.literal('')),
});

export const setPartnersSchema = z.object({
  partners: z.array(partnerSchema).max(30),
});

export const setAppConfigSchema = z.object({
  testimonialIntervalMs: z.number().int().min(1000).max(60000),
  testimonialAutoScroll: z.boolean(),
});

// --- Industries (tuiles « Au service de toutes les industries ») ---
export const industrySchema = z.object({
  name: z.string().min(1, 'Nom requis').max(80),
  imageUrl: z.string().url('URL image invalide').optional().or(z.literal('')),
});

export const setIndustriesSchema = z.object({
  industries: z.array(industrySchema).max(16),
});

// --- Footer ---
// href sécurisé : http(s)/mailto/tel ou chemin relatif (#, /). Bloque javascript:/data: (anti-XSS).
const safeHref = z
  .string()
  .max(300)
  .refine(
    (h) => /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(h.trim()),
    'Lien non autorisé',
  );

export const footerLinkSchema = z.object({
  label: z.string().min(1, 'Libellé requis').max(80),
  href: safeHref,
});

export const setFooterSchema = z.object({
  description: z.string().max(400),
  contactEmail: z.string().email('Email invalide').or(z.literal('')),
  location: z.string().max(120),
  columns: z
    .array(
      z.object({
        title: z.string().min(1, 'Titre requis').max(60),
        links: z.array(footerLinkSchema).max(8),
      }),
    )
    .max(4),
});
