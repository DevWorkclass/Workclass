import { z } from 'zod';

const themeIcon = z.enum(['briefcase', 'trending-up', 'lightbulb', 'rocket', 'globe']);

export const homeThemeSchema = z.object({
  icon: themeIcon,
  title: z.string().min(2, 'Titre requis').max(160),
  description: z.string().min(2, 'Description requise').max(400),
  imageUrl: z.string().url('URL image invalide').optional().or(z.literal('')),
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
